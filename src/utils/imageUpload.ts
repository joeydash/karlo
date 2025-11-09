export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Please select a valid file (JPEG, PNG, GIF, WebP, or PDF)",
    };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 10MB" };
  }

  return { valid: true };
};

export const hostMediaGoService = async (
  file: File,
  folderName: string,
  authToken: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const contentType = file.type || "image/jpeg";

    const arrayBuffer = await file.arrayBuffer();

    const { AUTH_CONFIG } = await import("./config");

    const response = await fetch(AUTH_CONFIG.MEDIA_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": contentType,
        "folder-name": folderName,
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Upload failed: ${response.status} ${errorText}`,
      };
    }

    const data = await response.json();

    if (data.hosted_file) {
      return {
        success: true,
        url: data.hosted_file,
      };
    } else {
      return {
        success: false,
        error: "No URL returned from upload",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
};
