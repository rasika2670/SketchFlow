const { query } = require('../../config/db');
const { cloudinary } = require('../../config/cloudinary');
const config = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const activityService = require('../activity/activity.service');

/**
 * Generate a signed upload signature for Cloudinary
 */
const getUploadSignature = (boardId) => {
  if (!config.cloudinary.apiSecret) {
    throw ApiError.internal('Cloudinary is not configured');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  // Folder can be dynamic, e.g. sketchflow/boards/{boardId}
  const folder = `sketchflow/boards/${boardId}`;

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder
    },
    config.cloudinary.apiSecret
  );

  return {
    timestamp,
    signature,
    folder,
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey
  };
};

/**
 * Register file upload metadata in PostgreSQL
 */
const registerUpload = async (userId, boardId, { name, public_id, mime_type, size }) => {
  const result = await query(
    `
    WITH inserted_file AS (
      INSERT INTO files (board_id, name, public_id, mime_type, size, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    )
    SELECT f.*, u.name as uploader_name, u.avatar_url as uploader_avatar
    FROM inserted_file f
    JOIN users u ON f.uploaded_by = u.id
    `,
    [boardId, name, public_id, mime_type || null, size || null, userId]
  );

  await activityService.log(boardId, userId, 'file_uploaded', { fileId: result.rows[0].id, name });

  return result.rows[0];
};

/**
 * Get all files for a board
 */
const getByBoardId = async (boardId) => {
  const result = await query(
    `
    SELECT f.*, u.name as uploader_name, u.avatar_url as uploader_avatar
    FROM files f
    JOIN users u ON f.uploaded_by = u.id
    WHERE f.board_id = $1
    ORDER BY f.created_at DESC
    `,
    [boardId]
  );

  return result.rows;
};

/**
 * Delete a file from Cloudinary and PostgreSQL
 */
const deleteFile = async (fileId, userId, userRole) => {
  // First, verify the file exists and the user has permission to delete it
  const fileResult = await query(
    'SELECT * FROM files WHERE id = $1',
    [fileId]
  );

  if (fileResult.rows.length === 0) {
    throw ApiError.notFound('File not found');
  }

  const file = fileResult.rows[0];

  // Only the uploader or a workspace admin can delete the file
  if (file.uploaded_by !== userId && userRole !== 'admin') {
    throw ApiError.forbidden('You do not have permission to delete this file');
  }

  // Delete from Cloudinary
  try {
    if (config.cloudinary.apiSecret) {
      await cloudinary.uploader.destroy(file.public_id);
    }
  } catch (error) {
    // We log the error but still proceed to delete from our DB 
    // to ensure our DB state can be cleaned up if Cloudinary deletion fails
    console.error('Failed to delete file from Cloudinary:', error);
  }

  // Delete from DB
  await query(
    'DELETE FROM files WHERE id = $1',
    [fileId]
  );

  await activityService.log(file.board_id, userId, 'file_deleted', { fileId, name: file.name });

  return file;
};

module.exports = {
  getUploadSignature,
  registerUpload,
  getByBoardId,
  deleteFile
};
