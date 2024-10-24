'use server';
import { db } from "@repo/db"
import axios from 'axios';
import { customAlphabet } from 'nanoid';
import formateRoomCode from "./helpers";
import { Song } from "../components/player";
import { revalidatePath } from "next/cache";

export const fetchSpotifyToken = async (userId: string) => {
  try {
    // Fetch the token object from the database
    const tokenObj = await db.spotifyTokens.findFirst({
      where: { userId },
    });

    if (!tokenObj) {
      return  { 
        access_token: null,
        spotifyConnected: false 
      };
    }

    // Check if the token has expired
    const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
    const tokenExpiryTime = tokenObj.createdAt.getTime() / 1000 + tokenObj.expires_in;

    if (currentTime >= tokenExpiryTime) {
      console.log('Token has expired. Refreshing...');

      const refreshToken = tokenObj.refresh_token;

      // Call the Spotify API to refresh the token
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.NEXT_SPOTIFY_CLIENT_ID as string,
          client_secret: process.env.NEXT_SPOTIFY_CLIENT_SECRET as string,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      const { access_token, expires_in } = response.data;

      // Update the database with the new access token
      await db.spotifyTokens.update({
        where: { id: tokenObj.id },
        data: {
          access_token,
          expires_in,
          createdAt: new Date(), // Update with the current time
        },
      });

      // Revalidate the current path to update the UI
      revalidatePath('/player'); // Replace with the actual page you want to revalidate

      console.log('Token refreshed successfully');
      return { access_token };
    }
    return { 
      access_token: tokenObj.access_token,
      spotifyConnected: tokenObj.access_token && true 
    };
  } catch (error) {
    console.error('Error fetching Spotify token:', error);
    throw new Error('Failed to fetch the access token');
  }
};

export const refreshSpotifyToken = async (userId: string) => {
  const tokenObj = await db.spotifyTokens.findFirst({
    where: { userId },
  });

  if(!tokenObj){
    console.error('Refreshing spotify token failed');
    return
  }

  // Check if the token has expired
  const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
  const tokenExpiryTime = tokenObj.createdAt.getTime() / 1000 + tokenObj.expires_in;

  if (currentTime >= tokenExpiryTime) {
    console.log('Token has expired. Refreshing... wrapper');

    const refreshToken = tokenObj.refresh_token;

    // Call the Spotify API to refresh the token
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.NEXT_SPOTIFY_CLIENT_ID as string,
        client_secret: process.env.NEXT_SPOTIFY_CLIENT_SECRET as string,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    const { access_token, expires_in } = response.data;

    // Update the database with the new access token
    await db.spotifyTokens.update({
      where: { id: tokenObj.id },
      data: {
        access_token,
        expires_in,
        createdAt: new Date(), // Update with the current time
      },
    });

    // Revalidate the current path to update the UI
    // revalidatePath('/player'); // Replace with the actual page you want to revalidate

    console.log('Token refreshed successfully');
    return  access_token ;
  }
}

export const createRoom = async (userId: string) => {
  const collaborative_room_code = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 10);
  const room_code = formateRoomCode(collaborative_room_code())
  try{
    const roomObj = await db.room.create({
      data:{
        room_code,
        name: 'sasd',
        ownerId: userId,
        songs:  { connect: [] },
      }
    })

    console.log('Room created successfully')
  }catch(error){
    console.error('Error creating the room:', error);
    throw new Error("Failed to create room");
  }
}

export const addSongsToRoom = async (
  userId: string,
  songList: Song[]
) => {
  try {
    console.log("usr =", userId)
    const room = await db.room.findFirst({
      where: { ownerId: userId },
    });

    if (!room) {
      throw new Error('Room not found for this user');
    }

    const updatedRoom = await db.room.update({
      where: { id: room.id },
      data: {
        songs: {
          create: songList.map(song => ({
            title: song.title,
            artist: song.artist,
            videoId: song.videoId,
            imageUrl: song.imageUrl,
          })),
        },
      },
      include: {
        songs: true,
      },
    });

    console.log('Songs added successfully to the room:', updatedRoom);
  } catch (error) {
    console.error('Error adding songs to the room:', error);
  }
};
