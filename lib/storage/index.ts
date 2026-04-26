import { Readable } from "stream"
import type { S3Client } from "@aws-sdk/client-s3"

export interface StorageAdapter {
  upload(
    userId: string,
    docId: string,
    stream: Readable,
    contentType: string,
    filename: string
  ): Promise<{ key: string; size: number }>
  get(key: string): Promise<Readable>
  delete(key: string): Promise<void>
  deletePrefix(prefix: string): Promise<void>
  getSignedUrl(key: string, expiresIn: number): Promise<string>
  getPublicUrl(key: string): string
}

export class LocalDiskAdapter implements StorageAdapter {
  private basePath: string

  constructor(basePath = "./uploads") {
    this.basePath = basePath
  }

  async upload(
    userId: string,
    docId: string,
    stream: Readable,
    _contentType: string,
    filename: string
  ): Promise<{ key: string; size: number }> {
    const fs = await import("fs")
    const path = await import("path")

    const docDir = path.join(this.basePath, userId, docId)
    const filePath = path.join(docDir, filename)

    await fs.promises.mkdir(docDir, { recursive: true })

    const writeStream = fs.createWriteStream(filePath)
    let size = 0

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => {
        size += chunk.length
      })

      stream
        .pipe(writeStream)
        .on("finish", () => {
          const key = `${userId}/${docId}/${filename}`
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

  async deletePrefix(prefix: string): Promise<void> {
    const fs = await import("fs")
    const path = await import("path")

    const dirPath = path.join(this.basePath, prefix)
    try {
      await fs.promises.rm(dirPath, { recursive: true, force: true })
    } catch {
      // Ignore if directory doesn't exist
    }
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    void expiresIn
    // For local development, return a local URL for the requested key
    return this.getPublicUrl(key)
  }

  getPublicUrl(key: string): string {
    // For local development, return a local URL
    return `/api/storage/${key}`
  }
}

export class S3Adapter implements StorageAdapter {
  private s3: S3Client
  private bucket: string

  constructor(
    bucket: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string,
    endpoint?: string
  ) {
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

  async upload(
    userId: string,
    docId: string,
    stream: Readable,
    _contentType: string,
    filename: string
  ): Promise<{ key: string; size: number }> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Upload } = require("@aws-sdk/lib-storage")

    const key = `${userId}/${docId}/${filename}`
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

  async deletePrefix(prefix: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ListObjectsV2Command, DeleteObjectCommand } = require("@aws-sdk/client-s3")

    // List all objects with the prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    })

    const response: any = await this.s3.send(listCommand)
    
    if (response.Contents) {
      // Delete each object
      for (const object of response.Contents) {
        if (object.Key) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: object.Key,
          })
          await this.s3.send(deleteCommand)
        }
      }
    }
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

type CloudinaryInstance = {
  config: (config: { cloud_name: string; api_key: string; api_secret: string }) => void
  uploader: {
    upload_stream: (options: Record<string, unknown>, callback: (error: Error | null, result: { bytes: number }) => void) => NodeJS.WritableStream
    destroy: (publicId: string, options: Record<string, unknown>) => Promise<void>
  }
  url: (publicId: string, options: Record<string, unknown>) => string
}

export class CloudinaryAdapter implements StorageAdapter {
  private _cloudinary: CloudinaryInstance | null = null
  private cloudName: string
  private apiKey: string
  private apiSecret: string

  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    this.cloudName = cloudName
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  private async getCloudinary(): Promise<CloudinaryInstance> {
    if (!this._cloudinary) {
      const { v2: cloudinary } = await import("cloudinary")
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      })
      this._cloudinary = cloudinary as unknown as CloudinaryInstance
    }
    return this._cloudinary
  }

  async upload(
    userId: string,
    docId: string,
    stream: Readable,
    _contentType: string,
    filename: string
  ): Promise<{ key: string; size: number }> {
    const key = `${userId}/${docId}/${filename}`

    // Always use "raw" so getPublicUrl() URL format is consistent for all file types
    const resourceType = "raw" as const

    const cloudinary = await this.getCloudinary()

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: key,
          resource_type: resourceType,
          folder: "pdf-annotator",
        },
        (error: Error | null, result: { bytes: number }) => {
          if (error) {
            reject(error)
          } else {
            resolve({ key, size: result.bytes })
          }
        }
      )

      stream.pipe(uploadStream)
    })
  }

  async get(key: string): Promise<Readable> {
    const https = await import("https")
    const url = this.getPublicUrl(key)
    
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode === 200) {
          resolve(response as unknown as Readable)
        } else {
          reject(new Error(`Failed to fetch file: ${response.statusCode}`))
        }
      }).on("error", reject)
    })
  }

  async delete(key: string): Promise<void> {
    const cloudinary = await this.getCloudinary()
    try {
      await cloudinary.uploader.destroy(`pdf-annotator/${key}`, {
        resource_type: "raw",
      })
    } catch {
      // Ignore if file doesn't exist
    }
  }

  async deletePrefix(prefix: string): Promise<void> {
    const cloudinary = await this.getCloudinary()
    try {
      // Cloudinary doesn't have a direct delete by prefix API for raw files
      // We need to delete the specific folder
      // For now, we'll delete the main document files
      // A more comprehensive solution would require listing all resources first
      const folderPath = `pdf-annotator/${prefix}`
      
      // Try to delete common file patterns
      const commonExtensions = ['.pdf', '.png', '.jpg', '.json', '.txt']
      for (const ext of commonExtensions) {
        try {
          await cloudinary.uploader.destroy(`${folderPath}${ext}`, {
            resource_type: "raw",
          })
        } catch {
          // Ignore individual failures
        }
      }
    } catch {
      // Ignore if folder doesn't exist
    }
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    void expiresIn
    // Proxy through server to avoid CORS issues and keep auth
    return `/api/storage/${key}`
  }

  getPublicUrl(key: string): string {
    // Construct Cloudinary URL directly — no SDK call needed for URL generation
    return `https://res.cloudinary.com/${this.cloudName}/raw/upload/pdf-annotator/${key}`
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
    case "cloudinary":
      return new CloudinaryAdapter(
        process.env.CLOUDINARY_CLOUD_NAME!,
        process.env.CLOUDINARY_API_KEY!,
        process.env.CLOUDINARY_API_SECRET!
      )
    default:
      throw new Error(`Unknown storage driver: ${driver}`)
  }
}
