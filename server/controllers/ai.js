// ai.js
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

export async function ai(content) {
    if (!content) throw new Error("Content is required");

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: content }],
                        },
                    ],
                }),
            }
        );

        const data = await response.json();

        return (
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn't generate a response."
        );
    } catch (err) {
        console.error("AI error:", err);
        throw new Error("AI request failed");
    }
}
