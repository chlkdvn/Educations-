import Follow from "../models/Follower.js";

export const followEducator = async (req, res) => {
  try {
    const followerId = req.user._id; // logged-in user
    const { educatorId } = req.params;

    if (followerId === educatorId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const follow = await Follow.create({
      followerId,
      educatorId,
    });

    res.status(201).json({
      success: true,
      message: "Educator followed successfully",
      follow,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Already following this educator",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to follow educator",
    });
  }
};



export const unfollowEducator = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { educatorId } = req.params;

    await Follow.findOneAndDelete({
      followerId,
      educatorId,
    });

    res.json({
      success: true,
      message: "Unfollowed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to unfollow",
    });
  }
};





export const checkFollowing = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { educatorId } = req.params;

    const isFollowing = await Follow.exists({
      followerId,
      educatorId,
    });

    res.json({
      success: true,
      isFollowing: Boolean(isFollowing),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check following status",
    });
  }
};



export const getEducatorFollowerCount = async (req, res) => {
  try {
    const { educatorId } = req.params;

    const count = await Follow.countDocuments({
      educatorId,
    });

    res.json({
      success: true,
      educatorId,
      followers: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get follower count",
    });
  }
};
