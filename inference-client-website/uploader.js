const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

async function uploadFile(filePath, userId, language) {
    if (!userId) {
        userId = "unknown";
    }
    const fileName = filePath.replace('uploads/','');
    const dest_path = `feedback/${userId}/${language}/${fileName}`;
    // console.log(filePath, fileName);
    const result = await storage.bucket(process.env.BUCKET_NAME).upload(filePath, { destination: dest_path });

    await storage.bucket(process.env.BUCKET_NAME).file(dest_path).makePublic();
    return result;
}
module.exports = {
    uploadFile
}   
