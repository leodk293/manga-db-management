import { NextResponse } from "next/server";
import MangaList from '../../../models/mangaList.model';
import { connectMongoDB } from '../../../connectDB';

export async function POST(request) {
    try {
        await connectMongoDB();

        const body = await request.json();
        const { mangaName, mangaPoster, mangaId, genres, status } = body;

        // Validate required fields
        if (!mangaName || !mangaPoster || !mangaId || !genres || !status) {
            return NextResponse.json(
                { error: "Missing required fields. Required: mangaName, mangaPoster, mangaId, genres, status" },
                { status: 400 }
            );
        }

        // Check if manga with the same mangaId already exists
        const existingManga = await MangaList.findOne({ mangaId });
        if (existingManga) {
            return NextResponse.json(
                { error: "Manga with this ID already exists" },
                { status: 409 }
            );
        }

        // Create new manga entry
        const newManga = new MangaList({
            mangaName,
            mangaPoster,
            mangaId,
            genres,
            status,
        });

        await newManga.save();

        return NextResponse.json(
            { message: "Manga stored successfully", manga: newManga },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error storing manga:", error);
        return NextResponse.json(
            { error: "Failed to store manga", details: error.message },
            { status: 500 }
        );
    }
}
