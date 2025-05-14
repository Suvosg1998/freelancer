const Bid = require('../model/bid.model');
const Job = require('../model/job.model');
const mongoose = require('mongoose');

class BidController {
  async placeBid(req, res) {
    try {
      const { proposal, amount, deliveryTime } = req.body;
      const job = await Job.findById(req.params.jobId);
      if (!job) return res.status(404).json({ message: 'Job not found' });

      const bid = await Bid.create({
        job: req.params.jobId,
        freelancer: req.user.id,
        proposal,
        amount,
        deliveryTime,
      });

      return res.status(201).json({ message: 'Bid placed', data: bid });
    } catch (err) {
      throw err;
    }
  }

  async getBidsForJob(req, res) {
    try {
      const jobId = req.params.jobId;
  
      // Check for valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({ message: 'Invalid Job ID' });
      }
  
      const bids = await Bid.aggregate([
        {
          $match: {
            job: new mongoose.Types.ObjectId(jobId)
          }
        },
        {
          $lookup: {
            from: 'users', // assumes collection is 'users'
            localField: 'freelancer',
            foreignField: '_id',
            as: 'freelancerInfo'
          }
        },
        { $unwind: '$freelancerInfo' },
        {
          $project: {
            proposal: 1,
            amount: 1,
            deliveryTime: 1,
            createdAt: 1,
            freelancer: '$freelancerInfo._id',
            freelancerName: '$freelancerInfo.name'
          }
        },
        { $sort: { createdAt: -1 } }
      ]);
  
      return res.status(200).json(bids);
    } catch (err) {
      throw err;
    }
  }
  
  async getBidsForClientJobs(req, res) {
    try {
      const clientId = req.user.id;
  
      const bids = await Bid.aggregate([
        // Join with jobs
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'jobInfo'
          }
        },
        { $unwind: '$jobInfo' },
  
        // Filter only bids for jobs created by this client
        {
          $match: {
            'jobInfo.client': new mongoose.Types.ObjectId(clientId)
          }
        },
  
        // Join with freelancer (user)
        {
          $lookup: {
            from: 'users',
            localField: 'freelancer',
            foreignField: '_id',
            as: 'freelancerInfo'
          }
        },
        { $unwind: '$freelancerInfo' },
  
        // Final output
        {
          $project: {
            _id: 1,
            amount: 1,
            proposal: 1,
            deliveryTime: 1,
            jobId: '$jobInfo._id',
            jobTitle: '$jobInfo.title',
            freelancerId: '$freelancerInfo._id',
            freelancerName: '$freelancerInfo.name',
            createdAt: 1
          }
        },
        { $sort: { createdAt: -1 } }
      ]);
  
      return res.status(200).json({ message: 'Bids found', data: bids });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching bids' });
    }
  }
  
  async acceptBid(req, res) {
    try {
      const bid = await Bid.findById(req.params.bidId);
      if (!bid) return res.status(404).json({ message: 'Bid not found' });

      const job = await Job.findOneAndUpdate(
        { _id: bid.job, client: req.user.id },
        { status: 'in progress', acceptedBid: bid._id },
        { new: true }
      );

      return res.status(200).json({ message: 'Bid accepted', data: job });
    } catch (err) {
      throw err;
    }
  }
   async rejectBid(req, res) {
    try {
      const bidId = req.params.bidId;
      // Check if the bid exists
      const bid = await Bid.findById(bidId);
      if (!bid) {
        return res.status(404).json({ message: 'Bid not found' });
      }
      // Check if the job belongs to the client
      const job = await Job.findOne({ _id: bid.job, client: req.user.id });
      if (!job) {
        return res.status(403).json({ message: 'Unauthorized to reject this bid' });
      }
      // Reject the bid
      await Bid.findOneAndUpdate(
        { _id: bid.job, client: req.user.id },
        { status: 'rejected' },
        { new: true }
      );
      return res.status(200).json({ message: 'Bid rejected successfully' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = new BidController();
