import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

function getClientInfo() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accesskeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION;

  if (!endpoint || !accesskeyId || !secretAccessKey) {
    throw new Error("stroage envs are missing here");
  }

  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId: accesskeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

export async function uploadBuffer(
  buffer: Buffer,
  contentType = "image/jpeg",
): Promise<{ imageUrl: string; publicId: string }> {
  const bucket = process.env.STORAGE_BUCKET;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  // The internal container-to-container endpoint (e.g. http://minio:9000)
  // that media-service uses to talk to storage isn't reachable from the
  // browser. AWS_PUBLIC_URL_S3 is the browser-facing base URL for the
  // same bucket (e.g. http://localhost:9000 via MinIO's published
  // port) -- falls back to the internal endpoint for real AWS S3
  // setups, where the endpoint is already publicly resolvable.
  const publicBaseUrl = process.env.AWS_PUBLIC_URL_S3 || endpoint;

  if (!bucket || !endpoint || !publicBaseUrl) {
    throw new Error("endpoint and bucket are not present");
  }

  const Key = `support-tasks/${randomUUID()}`;

  await getClientInfo().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  const baseUrl = publicBaseUrl.endsWith("/") ? publicBaseUrl.slice(0, -1) : publicBaseUrl;

  return {
    publicId: Key,
    imageUrl: `${baseUrl}/${bucket}/${Key}`,
  };
}
