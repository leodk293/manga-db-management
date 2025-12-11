import mongoose, { Schema, models } from "mongoose";

const mangaSchema = new Schema(
    {
        mangaName: {
            type: String,
            required: true,
        },
        mangaPoster: {
            type: String,
            required: true,
        },
        mangaId: {
            type: String,
            required: true,
        },
        genres: {
            type: Array,
            required: true,
        },
        status: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const MangaList = models.MangaList || mongoose.model("MangaList", mangaSchema);

export default MangaList;
