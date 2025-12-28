import { NextResponse } from "next/server";
import MangaList from '../../../models/mangaList.model';
import { connectMongoDB } from '../../../connectDB';

// CORS headers helper
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Allow all origins, or specify: 'https://anime-vista.netlify.app'
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight OPTIONS request
export const OPTIONS = async () => {
    return NextResponse.json({}, { headers: corsHeaders });
};

export const GET = async (request) => {
    try {
        await connectMongoDB();

        const url = new URL(request.url);
        const name = url.searchParams.get("name");
        const genres = url.searchParams.get("genres");
        const status = url.searchParams.get("status");

        // Build filter object based on provided parameters
        const filter = {};

        // Filter by manga name (case-insensitive partial match)
        if (name) {
            filter.mangaName = { $regex: name, $options: "i" };
        }

        // Filter by genre (check if genre is in the genres array)
        if (genres) {
            // If multiple genres provided (comma-separated), search for any of them
            const genreArray = genres.split(',').map(g => g.trim()).filter(g => g);
            if (genreArray.length > 0) {
                filter.genres = { $in: genreArray };
            }
        }

        // Filter by status (exact match)
        if (status) {
            filter.status = status;
        }

        const mangaList = await MangaList.find(filter).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            count: mangaList.length,
            mangaList
        }, { headers: corsHeaders });
    } catch (error) {
        console.error("Error fetching manga list:", error);
        return NextResponse.json(
            { error: "Failed to fetch manga list", details: error.message },
            { status: 500, headers: corsHeaders }
        );
    }
};
