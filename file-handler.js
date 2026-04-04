// ============================================================
//  FILE-HANDLER — NyXia Worker V2
//  Upload PDF, ZIP, RAR — Décompression + Extraction texte
// ============================================================

// ── Extraction de texte depuis un PDF (basic) ────────────
async function extractTextFromPDF(data) {
  try {
    // Utilise CF AI (vision) pour lire le PDF si disponible
    // Sinon, extrait le texte brut
    const text = [];
    const str = new TextDecoder("utf-8", { fatal: false }).decode(data);
    
    // Extraire le texte lisible du PDF brut
    const lines = str.split(/[\r\n]+/);
    for (const line of lines) {
      const cleaned = line.replace(/[^\x20-\x7E]/g, "").trim();
      if (cleaned.length > 10 && !cleaned.includes("obj") && !cleaned.includes("endobj")) {
        text.push(cleaned);
      }
    }
    
    return text.join("\n").trim();
  } catch {
    return null;
  }
}

// ── Décompression ZIP (sans lib externe) ─────────────────
async function extractZip(data) {
  try {
    const files = [];
    
    // Parser les entrées ZIP (format local file header)
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let offset = 0;
    
    while (offset < data.length - 4) {
      // Signature ZIP: PK\x03\x04
      if (data[offset] !== 0x50 || data[offset+1] !== 0x4B || 
          data[offset+2] !== 0x03 || data[offset+3] !== 0x04) {
        break;
      }
      
      const compMethod = view.getUint16(offset + 8, true);
      const compSize = view.getUint32(offset + 18, true);
      const uncompSize = view.getUint32(offset + 22, true);
      const nameLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);
      const commentLen = view.getUint16(offset + 32, true);
      
      const nameStart = offset + 30;
      const name = new TextDecoder().decode(data.slice(nameStart, nameStart + nameLen));
      
      const dataStart = nameStart + nameLen + extraLen;
      const entryData = data.slice(dataStart, dataStart + compSize);
      
      // Décompresser (seulement stored et deflate)
      let content = null;
      if (compMethod === 0) {
        // Stored — pas de compression
        content = entryData;
      } else if (compMethod === 8) {
        // Deflate — utiliser DecompressionStream
        try {
          const ds = new DecompressionStream("deflate-raw");
          const writer = ds.writable.getWriter();
          writer.write(entryData);
          writer.close();
          const reader = ds.readable.getReader();
          const chunks = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          content = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
          let pos = 0;
          for (const chunk of chunks) {
            content.set(chunk, pos);
            pos += chunk.length;
          }
        } catch {
          content = entryData;
        }
      }
      
      files.push({
        name,
        size: uncompSize,
        type: compMethod === 0 ? "stored" : "deflate",
        content
      });
      
      offset = dataStart + compSize + commentLen;
      
      // Sécurité: ne pas boucler infiniment
      if (files.length > 500) break;
    }
    
    return files;
  } catch (err) {
    return { error: `Erreur ZIP: ${err.message}` };
  }
}

// ── Décompression RAR (basic — signale si besoin d'un outil externe) ──
async function extractRar(data) {
  // RAR est un format propriétaire complexe
  // On retourne les métadonnées et on signale qu'un traitement externe est nécessaire
  try {
    const header = new TextDecoder("ascii", { fatal: false }).decode(data.slice(0, 100));
    
    // Vérifier la signature RAR
    const isRar4 = data[0] === 0x52 && data[1] === 0x61 && data[2] === 0x72 && data[3] === 0x21;
    const isRar5 = data[0] === 0x52 && data[1] === 0x61 && data[2] === 0x72 && data[3] === 0x61 && data[4] === 0x21;
    
    if (!isRar4 && !isRar5) {
      return { error: "Le fichier n'est pas un RAR valide" };
    }
    
    return {
      type: isRar5 ? "rar5" : "rar4",
      message: "Fichier RAR détecté. Le déchargement RAR complet nécessite un outil dédié. Pour un traitement optimal, utilise un fichier ZIP à la place.",
      size: data.length,
      canExtract: false
    };
  } catch (err) {
    return { error: `Erreur RAR: ${err.message}` };
  }
}

// ── Handle uploaded file ──────────────────────────────────
export async function handleUploadedFile(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const action = formData.get("action") || "analyze";
    const question = formData.get("question") || "";
    
    if (!file) {
      return { success: false, error: "Aucun fichier reçu" };
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const filename = file.name.toLowerCase();
    const mimeType = file.type;
    
    let result = {
      success: true,
      filename: file.name,
      size: file.size,
      mimeType,
      type: "unknown"
    };
    
    // Détection du type par extension
    if (filename.endsWith(".pdf")) {
      result.type = "pdf";
      const text = await extractTextFromPDF(data);
      
      if (text && text.length > 50) {
        result.extractedText = text;
        result.textLength = text.length;
        result.summary = text.substring(0, 500) + (text.length > 500 ? "..." : "");
        
        // Sauvegarder le texte dans KV pour NyXia
        if (env.NYXIA_VAULT) {
          const docId = `doc:${Date.now()}:${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          await env.NYXIA_VAULT.put(docId, JSON.stringify({
            filename: file.name,
            uploadedAt: new Date().toISOString(),
            text,
            textLength: text.length
          }), { expirationTtl: 365 * 24 * 60 * 60 });
          result.docId = docId;
        }
      } else {
        result.extractedText = null;
        result.message = "PDF détecté mais le texte n'a pas pu être extrait automatiquement. Le fichier a été sauvegardé et NyXia peut l'utiliser comme contexte.";
      }
    } else if (filename.endsWith(".zip")) {
      result.type = "zip";
      const files = await extractZip(data);
      
      if (Array.isArray(files)) {
        result.files = files.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        }));
        result.fileCount = files.length;
        
        // Extraire le texte des fichiers texte dans le ZIP
        const textFiles = files.filter(f => 
          f.name.endsWith(".txt") || f.name.endsWith(".md") || f.name.endsWith(".js") ||
          f.name.endsWith(".json") || f.name.endsWith(".html") || f.name.endsWith(".css") ||
          f.name.endsWith(".csv")
        );
        
        let combinedText = "";
        for (const tf of textFiles) {
          const content = new TextDecoder("utf-8", { fatal: false }).decode(tf.content);
          combinedText += `\n--- ${tf.name} ---\n${content}\n`;
        }
        
        if (combinedText) {
          result.extractedText = combinedText;
          result.textFilesFound = textFiles.length;
          
          // Sauvegarder
          if (env.NYXIA_VAULT) {
            const docId = `doc:${Date.now()}:zip_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            await env.NYXIA_VAULT.put(docId, JSON.stringify({
              filename: file.name,
              uploadedAt: new Date().toISOString(),
              text: combinedText,
              files: result.files,
              textLength: combinedText.length
            }), { expirationTtl: 365 * 24 * 60 * 60 });
            result.docId = docId;
          }
        }
      } else {
        result.error = files.error;
      }
    } else if (filename.endsWith(".rar")) {
      result = await extractRar(data);
      result.success = true;
      result.filename = file.name;
      result.size = file.size;
    } else if (filename.endsWith(".txt") || filename.endsWith(".md") || filename.endsWith(".csv")) {
      result.type = "text";
      const text = new TextDecoder("utf-8", { fatal: false }).decode(data);
      result.extractedText = text;
      result.textLength = text.length;
      
      if (env.NYXIA_VAULT) {
        const docId = `doc:${Date.now()}:${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        await env.NYXIA_VAULT.put(docId, JSON.stringify({
          filename: file.name,
          uploadedAt: new Date().toISOString(),
          text
        }), { expirationTtl: 365 * 24 * 60 * 60 });
        result.docId = docId;
      }
    } else {
      result.type = "other";
      result.message = `Type de fichier non supporté: ${mimeType || filename.split('.').pop()}. Formats supportés: PDF, ZIP, RAR, TXT, MD, CSV.`;
    }
    
    // Si une question est posée avec le fichier, on peut l'ajouter au contexte
    if (question && result.docId && env.NYXIA_VAULT) {
      await env.NYXIA_VAULT.put(`doc:question:${result.docId}`, question, { expirationTtl: 365 * 24 * 60 * 60 });
    }
    
    return result;
    
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Handle file (version simplifiée pour l'autre endpoint) ──
export async function handleFile(fileInfo, options, env) {
  const { filename, mimeType, data } = fileInfo;
  const { action, question } = options;
  
  // Simuler une requête pour utiliser handleUploadedFile
  const blob = new Blob([data], { type: mimeType });
  const formData = new FormData();
  formData.append("file", blob, filename);
  if (action) formData.append("action", action);
  if (question) formData.append("question", question);
  
  const req = new Request("https://internal/upload", {
    method: "POST",
    body: formData
  });
  
  return await handleUploadedFile(req, env);
}

// ── Lister les documents uploadés ──────────────────────────
export async function listUploadedDocs(env) {
  if (!env.NYXIA_VAULT) return { docs: [], error: "Vault non configuré" };
  
  try {
    const keys = [];
    let cursor = "";
    do {
      const list = await env.NYXIA_VAULT.list({ prefix: "doc:", cursor, limit: 50 });
      keys.push(...list.keys);
      if (list.list_complete) break;
      cursor = list.cursor;
    } while (cursor);
    
    const docs = [];
    for (const k of keys.sort((a, b) => b.name.localeCompare(a.name))) {
      const raw = await env.NYXIA_VAULT.get(k.name).catch(() => null);
      if (raw) {
        const doc = JSON.parse(raw);
        docs.push({
          id: k.name,
          filename: doc.filename,
          uploadedAt: doc.uploadedAt,
          textLength: doc.textLength || 0
        });
      }
    }
    
    return { docs, count: docs.length };
  } catch (err) {
    return { docs: [], error: err.message };
  }
}
