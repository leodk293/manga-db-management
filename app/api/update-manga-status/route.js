import { NextResponse } from "next/server";
import MangaList from "../../../models/mangaList.model";
import { connectMongoDB } from "../../../connectDB";

export async function PATCH(request) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { mangaId, status } = body;

    if (!mangaId || !status) {
      return NextResponse.json(
        { error: "Missing required fields. Required: mangaId, status" },
        { status: 400 }
      );
    }

    const updatedManga = await MangaList.findOneAndUpdate(
      { mangaId: String(mangaId) },
      { status },
      { new: true }
    );

    if (!updatedManga) {
      return NextResponse.json(
        { error: "Manga not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Manga status updated successfully", manga: updatedManga },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating manga status:", error);
    return NextResponse.json(
      { error: "Failed to update manga status", details: error.message },
      { status: 500 }
    );
  }
}
