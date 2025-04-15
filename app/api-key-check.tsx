export async function checkApiKeyConfigured(): Promise<boolean> {
  return !!process.env.GOOGLE_MAPS_API_KEY
}
