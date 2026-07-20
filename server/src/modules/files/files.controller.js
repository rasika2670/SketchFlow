const filesService = require('./files.service');
const { getIO } = require('../../sockets');

/**
 * Get Cloudinary upload signature
 * GET /api/boards/:boardId/files/signature
 */
const getUploadSignature = async (req, res) => {
  const { boardId } = req.params;

  const signatureData = filesService.getUploadSignature(boardId);

  res.status(200).json({
    success: true,
    data: signatureData,
    meta: { timestamp: new Date().toISOString() }
  });
};

/**
 * Register a new file upload
 * POST /api/boards/:boardId/files
 */
const registerUpload = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.id;
  const fileData = req.body;

  const newFile = await filesService.registerUpload(userId, boardId, fileData);

  // Broadcast to board room
  getIO().to(`board:${boardId}`).emit('file:uploaded', newFile);

  res.status(201).json({
    success: true,
    data: newFile,
    meta: { timestamp: new Date().toISOString() }
  });
};

/**
 * Get all files for a board
 * GET /api/boards/:boardId/files
 */
const getByBoardId = async (req, res) => {
  const { boardId } = req.params;

  const files = await filesService.getByBoardId(boardId);

  res.status(200).json({
    success: true,
    data: files,
    meta: { timestamp: new Date().toISOString() }
  });
};

/**
 * Delete a file
 * DELETE /api/boards/:boardId/files/:fileId
 */
const deleteFile = async (req, res) => {
  const { boardId, fileId } = req.params;
  const userId = req.user.id;
  
  // requireBoardRole attaches req.membership
  const userRole = req.membership.role;

  const deletedFile = await filesService.deleteFile(fileId, userId, userRole);

  // Broadcast deletion so clients can update their UI
  getIO().to(`board:${boardId}`).emit('file:deleted', { id: deletedFile.id });

  res.status(204).send();
};

module.exports = {
  getUploadSignature,
  registerUpload,
  getByBoardId,
  deleteFile
};
