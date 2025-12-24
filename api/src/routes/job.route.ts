import { createJob } from "../job/job.services";
import { JobResult } from "../job/job.type";
import { Router, Request, Response } from "express";

const router = Router();

router.post("/jobs", async (req: Request, res: Response) => {
  try {
    const jobData = req.body;
    await createJob(jobData);

    res.status(201).json({ message: "Job created successfully", jobData });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).send({ error: "Failed to create job" });
  }
});

export default router;