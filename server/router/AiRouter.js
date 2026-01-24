// AiRouter.js
import express from "express";
import multer from "multer";
import fs from "fs";
import { createRequire } from "module";
import { ai } from "../controllers/ai.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const airouter = express.Router();

// Multer setup
const upload = multer({ dest: "uploads/" });

// POST /ai - text
airouter.post("/ai", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    try {
        const reply = await ai(message);
        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /ai/file - file upload
airouter.post("/ai/file", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "File is required" });

    try {
        let content = "";

        // Text-based files
        if (
            req.file.mimetype.startsWith("text/") ||
            req.file.originalname.endsWith(".csv") ||
            req.file.originalname.endsWith(".json")
        ) {
            content = fs.readFileSync(req.file.path, "utf-8");
        }

        // PDF files
        else if (req.file.mimetype === "application/pdf") {
            const buffer = fs.readFileSync(req.file.path);
            const pdf = await pdfParse(buffer);
            content = pdf.text || "PDF has no readable text";
        }

        // Other files
        else {
            content = `User uploaded ${req.file.originalname} (${req.file.mimetype}, ${(
                req.file.size / 1024
            ).toFixed(2)} KB)`;
        }

        const reply = await ai(`Analyze this content:\n\n${content}`);

        fs.unlinkSync(req.file.path); // cleanup
        res.json({ reply });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to process file" });
    }
});

export default airouter;
