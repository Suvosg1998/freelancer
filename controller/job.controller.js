const Job = require('../model/job.model');
const mongoose = require('mongoose');

class JobController {
  async createJob(req, res) {
    try {
      const job = await Job.create({ ...req.body, client: req.user.id });
      return res.status(201).json({ message: 'Job created', data: job });
    } catch (err) {
      throw err;
    }
  }

  async getJobs(req, res) {
    try {
      const { budget, skills, date } = req.query;
      const matchStage = {isDeleted: false};
  
      if (budget) matchStage.budget = { $lte: Number(budget) };
  
      if (skills) {
        const skillArray = skills.split(',').map(skill => skill.trim());
        matchStage.skills = { $in: skillArray };
      }
  
      if (date) {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate)) {
          matchStage.createdAt = { $gte: parsedDate };
        }
      }
  
      const jobs = await Job.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'users', 
            localField: 'client',
            foreignField: '_id',
            as: 'clientInfo'
          }
        },
        { $unwind: '$clientInfo' },
        {
          $project: {
            title: 1,
            description: 1,
            skills: 1,
            budget: 1,
            deadline: 1,
            status: 1,
            createdAt: 1,
            clientName: '$clientInfo.name',
            isDeleted: 1
          }
        },
        { $sort: { createdAt: -1 } }
      ]);
  
      return res.status(200).json(jobs);
    } catch (err) {
      throw err;
    }
  }

  async getJobById(req, res) {
    try {
      const jobId = req.params.id;
  
      // Validate ObjectId format
      if (!jobId) {
        return res.status(400).json({ message: 'Invalid Job ID' });
      }
  
      const job = await Job.aggregate([
        {
          $match: {
            isDeleted: false,
            _id: new mongoose.Types.ObjectId(jobId)
          }
        },
        {
          $lookup: {
            from: 'users', // MongoDB collection name (usually lowercase + plural)
            localField: 'client',
            foreignField: '_id',
            as: 'clientInfo'
          }
        },
        { $unwind: '$clientInfo' },
        {
          $project: {
            title: 1,
            description: 1,
            skills: 1,
            budget: 1,
            deadline: 1,
            status: 1,
            createdAt: 1,
            isDeleted: 1,
            clientName: '$clientInfo.name'
          }
        }
      ]);
  
      if (!job.length) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      return res.status(200).json({ message: 'Job found', data: job[0] });
    } catch (err) {
      throw err;
    }
  }
  

  async updateJob(req, res) {
    try {
      const job = await Job.findById(req.params.id);
      if (!job || job.client.toString() !== req.user.id) {
        return res.status(404).json({ message: 'Job not found or unauthorized' });
      }
  
      const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return res.status(200).json({ message: 'Job updated', data: updatedJob });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async deleteJob(req, res) {
    try {
      const job = await Job.findOneAndUpdate({ _id: req.params.id, client: req.user.id, },{isDeleted: true});
      if (!job) return res.status(404).json({ message: 'Job not found or unauthorized' });
      return res.status(200).json({ message: 'Job deleted' });
    } catch (err) {
      throw err;
    }
  }
}

module.exports = new JobController();
