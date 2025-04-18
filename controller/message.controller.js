const Message = require('../model/message.model');

class MessageController {
  async sendMessage(req, res) {
    try {
      const { receiverId, content } = req.body;
      const message = await Message.create({
        sender: req.user.id,
        receiver: receiverId,
        content,
      });

      return res.status(201).json({ message: 'Message sent', data: message });
    } catch (err) {
      throw err;
    }
  }

  async getMessages(req, res) {
    try {
      const messages = await Message.find({
        $or: [
          { sender: req.user.id, receiver: req.params.userId },
          { sender: req.params.userId, receiver: req.user.id },
        ],
      }).sort({ createdAt: 1 });

      return res.status(200).json(messages);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = new MessageController();
