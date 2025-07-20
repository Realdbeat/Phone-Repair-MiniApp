<?php
// filepath: c:\Users\reald\Documents\GitHub\Phone-Repair-MiniApp\upload.php
header('Content-Type: application/json');
if (!isset($_FILES['image'])) {
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}
$targetDir = "uploads/";
if (!is_dir($targetDir)) mkdir($targetDir, 0777, true);
$filename = uniqid("img_") . ".jpg";
$targetFile = $targetDir . $filename;

if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
    // Return the URL to the uploaded image
    $url = $targetFile;
    echo json_encode(['url' => $url]);
} else {
    echo json_encode(['error' => 'Upload failed']);
}