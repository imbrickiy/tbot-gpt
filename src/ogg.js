// файл для работы с аудио
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import axios from 'axios';
import { createWriteStream } from 'fs';
// для определения пути
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { removeFile } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url))

class OggConverter {
  constructor() {
    // устанавливаем путь до конвертера
    ffmpeg.setFfmpegPath(installer.path)
  }
  toMp3(input, output) {
    try {
  // получаем путо до папки voices (dirname(input))
      const outputPath = resolve(dirname(input), `${output}.mp3`)
      return new Promise((resolve, reject) => {
        // работа с кодеками
        ffmpeg(input)
          .inputOption('-t 30')
          .output(outputPath)
          .on('end', () => {
            removeFile(input)
            resolve(outputPath)
          })
          .on('error', err => reject(err.message))
          .run()
      })
} catch (error) {
  console.log('Error while creating mp3', error.message);
}
  }
  async create(url, filename) {
    try {
      // определяем в каком месте находимся
      const oggPath = resolve(__dirname, '../voices', `${filename}.ogg`)
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream',
      })     
      return new Promise(resolve => {
        // сохраняем файл в директорию voices
        const stream = createWriteStream(oggPath)
        response.data.pipe(stream)
        // понимаем когда stream завершится
        stream.on('finish', () => resolve(oggPath))        
      })
    } catch (error) {
      console.log('Error while creating ogg-file', error.message)
    }
  }
}

export const ogg = new OggConverter();
