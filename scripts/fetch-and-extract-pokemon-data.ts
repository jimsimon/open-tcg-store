#!/usr/bin/env -S npx tsx

import { mkdir } from "fs/promises";
import { join } from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const fileStream = createWriteStream(outputPath);
  await pipeline(response.body as any, fileStream);
}

async function extractTarGz(inputPath: string, outputDir: string): Promise<void> {
  // Create the output directory if it doesn't exist
  await mkdir(outputDir, { recursive: true });

  console.log(`Extracting ${inputPath} to ${outputDir} using tar command...`);
  await execAsync(`tar -xzf ${inputPath} -C ${outputDir}`);
  console.log("Extraction completed");
}

async function main(): Promise<void> {
  try {
    // Get the latest release URL
    console.log("Fetching latest Pokemon TCG data release...");
    const result = await fetch("https://api.github.com/repos/PokemonTCG/pokemon-tcg-data/releases/latest");
    const latestReleaseManifest = await result.json();
    const downloadUrl = latestReleaseManifest.tarball_url;

    console.log(`Found download URL: ${downloadUrl}`);

    // Ensure the sqlite-data directory exists
    const sqliteDataDir = join(process.cwd(), "sqlite-data");
    await mkdir(sqliteDataDir, { recursive: true });

    // Download the file
    const tarballPath = join(sqliteDataDir, "pokemon-data.tar.gz");
    console.log(`Downloading Pokemon TCG data to ${tarballPath}...`);
    await downloadFile(downloadUrl, tarballPath);
    console.log("Download completed");

    // Create the pokemon-data directory
    const pokemonDataDir = join(sqliteDataDir, "pokemon-data");
    await mkdir(pokemonDataDir, { recursive: true });

    // Extract the tarball
    console.log("Extracting Pokemon TCG data...");
    await extractTarGz(tarballPath, pokemonDataDir);
  } catch (error) {
    console.error("Error building Pokemon data:", error);
    process.exit(1);
  }
}

main();
