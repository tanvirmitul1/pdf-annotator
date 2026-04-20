import { Readable } from "stream"
import type { S3Client } from "@aws-sdk/client-s3"

export interface StorageAdapter {
  upload(userId: string, docId: string, stream: Readable, contentType: string, filename: string): Promise<{ key: string; size: number }>
  get(key: string): Promise<Readable>
  delete(key: string): Promise<void>
  getSignedUrl(key: string, expiresIn: number): Promise<string>
  getPublicUrl(key: string): string
}

export class LocalDiskAdapter implements StorageAdapter {
  private basePath: string

  constructor(basePath = "./uploads") {
    this.basePath = basePath
  }

  async upload(userId: string, docId: string, stream: Readable): Promise<{ key: string; size: number }> {
    const fs = await import("fs")
    const path = await import("path")

    const userDir = path.join(this.basePath, userId)
    const docDir = path.join(userDir, docId)
    const originalPath = path.join(docDir, "original")

    await fs.promises.mkdir(docDir, { recursive: true })

    const writeStream = fs.createWriteStream(originalPath)
    let size = 0

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => {
        size += chunk.length
      })

      stream.pipe(writeStream)
        .on("finish", () => {
          const key = `${userId}/${docId}/original`
          resolve({ key, size })
        })
        .on("error", reject)
    })
  }

  async get(key: string): Promise<Readable> {
    const fs = await import("fs")
    const path = await import("path")

    const filePath = path.join(this.basePath, key)
    return fs.createReadStream(filePath)
  }

  async delete(key: string): Promise<void> {
    const fs = await import("fs")
    const path = await import("path")

    const filePath = path.join(this.basePath, key)
    try {
      await fs.promises.unlink(filePath)
    } catch {
      // Ignore if file doesn't exist
    }
  }

  async getSignedUrl(): Promise<string> {
    // For local development, return a local URL
    return this.getPublicUrl("")
  }

  getPublicUrl(key: string): string {
    // For local development, return a local URL
    return `/api/storage/${key}`
  }
}

export class S3Adapter implements StorageAdapter {
  private s3: S3Client
  private bucket: string

  constructor(bucket: string, region: string, accessKeyId: string, secretAccessKey: string, endpoint?: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { S3Client } = require("@aws-sdk/client-s3")
    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      forcePathStyle: !!endpoint, // For R2 compatibility
    })
    this.bucket = bucket
  }

  async upload(userId: string, docId: string, stream: Readable): Promise<{ key: string; size: number }> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Upload } = require("@aws-sdk/lib-storage")

    const key = `${userId}/${docId}/original`
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
      },
    })

    await upload.done()

    return { key, size: 0 } // TODO: Get actual size
  }

  async get(key: string): Promise<Readable> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GetObjectCommand } = require("@aws-sdk/client-s3")

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    const response = await this.s3.send(command)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response as any).Body as Readable
  }

  async delete(key: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DeleteObjectCommand } = require("@aws-sdk/client-s3")

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    await this.s3.send(command)
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GetObjectCommand } = require("@aws-sdk/client-s3")
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    return await getSignedUrl(this.s3, command, { expiresIn })
  }

  getPublicUrl(key: string): string {
    // For S3, return the public URL if bucket is public, otherwise signed URL
    return `https://${this.bucket}.s3.amazonaws.com/${key}`
  }
}

export function createStorageAdapter(): StorageAdapter {
  const driver = process.env.STORAGE_DRIVER || "local"

  switch (driver) {
    case "local":
      return new LocalDiskAdapter(process.env.STORAGE_LOCAL_PATH || "./uploads")
    case "s3":
    case "r2":
      return new S3Adapter(
        process.env.S3_BUCKET!,
        process.env.S3_REGION!,
        process.env.S3_ACCESS_KEY_ID!,
        process.env.S3_SECRET_ACCESS_KEY!,
        process.env.S3_ENDPOINT
      )
    default:
      throw new Error(`Unknown storage driver: ${driver}`)
  }
}