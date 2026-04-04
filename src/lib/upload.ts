import { supabase } from "@/context/AuthContext";

/**
 * Upload gambar ke Supabase Storage
 * @param file - File image dari input
 * @param folder - Nama folder (default: 'produk-images')
 * @returns URL publik gambar atau null jika gagal
 */
export async function uploadImage(file: File, folder: string = 'produk-images'): Promise<string | null> {
  if (!supabase) {
    alert("Supabase tidak tersedia");
    return null;
  }

  try {
    // Validasi file
    if (!file.type.startsWith('image/')) {
      alert("File harus berupa gambar");
      return null;
    }
    
    if (file.size > 5 * 1024 * 1024) { // Max 5MB
      alert("Ukuran file maksimal 5MB");
      return null;
    }

    // Generate nama unik: timestamp-random.ext
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload ke Supabase
    const { error: uploadError } = await supabase.storage
      .from(folder)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Dapatkan URL publik
    const { data: publicUrlData } = supabase.storage
      .from(folder)
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;

  } catch (error: any) {
    console.error("Upload error:", error);
    alert("Gagal upload: " + error.message);
    return null;
  }
}

/**
 * Hapus gambar dari storage
 */
export async function deleteImage(imageUrl: string, folder: string = 'produk-images'): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Extract filename dari URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const folderName = urlParts[urlParts.length - 2];
    const path = `${folderName}/${fileName}`;

    const { error } = await supabase.storage
      .from(folder)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Delete image error:", error);
    return false;
  }
}
