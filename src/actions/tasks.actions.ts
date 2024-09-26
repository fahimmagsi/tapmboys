"use server";

import { connectMongoDB } from "@/lib/mongodb";
import prisma from "@/lib/prisma";
import Tasks from "@/models/Tasks";
import TasksCompletion from "@/models/taskCompletion";
import User from "@/models/user";

export type TasksList = {
  id?: string;
  category: string;
  name: string;
  points: number;
  icon: string;
};

export type CompletedTasksType = {
  id?: string;
  taskId: string;
  userId: string;
  reward: number;
};

export async function tasksList(): Promise<TasksList[]> {
  try {
    connectMongoDB();

    const tasks = await Tasks.find();

    return tasks as TasksList[]; // Ensure tasks are typed correctly
  } catch (error) {
    console.log({ error });
    return [];
  }
}

export async function completeTask({
  userId,
  taskId,
}: {
  userId: string;
  taskId: string;
}): Promise<
  | "success"
  | "unknownError"
  | "invalidTask"
  | "userNotExist"
  | "taskAlreadyCompleted"
> {
  try {
    connectMongoDB();

    // Fetch the task using findOne instead of find to get a single document
    const task = await Tasks.findOne({ where: { id: taskId } });
    if (!task) return "invalidTask";

    const user = await User.findOne({ where: { chatId: userId } });
    console.log(user);

    if (!user) return "userNotExist";

    const taskCompletion = await TasksCompletion.findOne({ where: { taskId, userId } });
    if (taskCompletion) return "taskAlreadyCompleted";

    await TasksCompletion.create({
      reward: task.points, // Now task is correctly typed and has points
      taskId,
      userId,
    });

    return "success";
  } catch (e) {
    console.log(e);
    return "unknownError";
  }
}

export async function checkCompletedTasks({
  userId,
  taskId,
}: {
  taskId: string;
  userId: string;
}): Promise<boolean> {
  try {
    connectMongoDB();

    const completion = await TasksCompletion.findOne({
      where: { userId, taskId },
    });

    console.log({ completion });
    return !!completion;
  } catch (e) {
    console.log(e);
    return false;
  }
}
