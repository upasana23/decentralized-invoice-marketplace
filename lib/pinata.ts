const PINATA_PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

function getPinataJwt(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error("PINATA_JWT environment variable is not set");
  }
  return jwt;
}

function getGatewayBase(): string {
  return (
    process.env.NEXT_PUBLIC_PINATA_GATEWAY_BASE_URL ||
    "https://gateway.pinata.cloud/ipfs/"
  );
}

export type PinataPinResponse = {
  cid: string;
  uri: string;
  gatewayUrl: string;
};

function buildGatewayUrl(cid: string): string {
  const base = getGatewayBase();
  return base.endsWith("/") ? `${base}${cid}` : `${base}/${cid}`;
}

export async function uploadFileToIPFS(
  file: Blob,
  fileName: string
): Promise<PinataPinResponse> {
  const jwt = getPinataJwt();

  const formData = new FormData();
  formData.append("file", file, fileName);

  const res = await fetch(PINATA_PIN_FILE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Pinata file upload failed", res.status, text);
    throw new Error("Failed to upload file to IPFS via Pinata");
  }

  const json = (await res.json()) as { IpfsHash: string };
  const cid = json.IpfsHash;

  return {
    cid,
    uri: `ipfs://${cid}`,
    gatewayUrl: buildGatewayUrl(cid),
  };
}

export async function uploadJSONToIPFS(
  content: unknown,
  options?: { name?: string }
): Promise<PinataPinResponse> {
  const jwt = getPinataJwt();

  const body: any = {
    pinataContent: content,
  };

  if (options?.name) {
    body.pinataMetadata = {
      name: options.name,
    };
  }

  const res = await fetch(PINATA_PIN_JSON_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Pinata JSON upload failed", res.status, text);
    throw new Error("Failed to upload JSON metadata to IPFS via Pinata");
  }

  const json = (await res.json()) as { IpfsHash: string };
  const cid = json.IpfsHash;

  return {
    cid,
    uri: `ipfs://${cid}`,
    gatewayUrl: buildGatewayUrl(cid),
  };
}
