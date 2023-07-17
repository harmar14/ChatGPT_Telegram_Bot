import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import { createWriteStream } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { removeFile } from './utils.js'

const __dirname = dirname(fileURLToPath(import.meta.url));

class Converter {
    constructor() {
        ffmpeg.setFfmpegPath(installer.path);
    }

    convert(inFile, outFile) {
        try {
            const outPath = resolve(dirname(inFile), `${outFile}.mp3`);
            return new Promise((resolve, reject) => {
                ffmpeg(inFile)
                    .inputOption('-t 30')
                    .output(outPath)
                    .on('end', () => {
                        removeFile(inFile);
                        resolve(outPath);
                    })
                    .on('error', err => reject(err.message))
                    .run();
            });
        } catch (e) {
            console.log('Error occured while converting ogg to MP3.', e.message);
        }
    }

    async create(url, filename) {
        try {
            const oggPath = resolve(__dirname, '../tmp', `${filename}.ogg`);
            const response = await axios({
                method: 'get',
                url,
                responseType: 'stream'
            });
            return new Promise(resolve => {
                const stream = createWriteStream(oggPath);
                response.data.pipe(stream);
                stream.on('finish', () => resolve(oggPath));
            });
            
        } catch (e) {
            console.log(`Error occured while creating ogg.`, e.message);
        }
        
    }
}

export const ogg = new Converter();