'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

interface Participant {
	id: string;
	userId: string;
	role: string;
	status: string;
	user: {
		name: string;
		image: string;
	};
}

interface Task {
	id: string;
	title: string;
	description: string;
	assignedTo: string;
	status: string;
}

interface Session {
	id: string;
	name: string;
	description: string;
	startTime: string;
	endTime: string;
	maxParticipants: number;
	status: string;
	participants: Participant[];
	tasks: Task[];
}

interface GroupPrepSessionProps {
	sessionId: string;
}

export default function GroupPrepSession({ sessionId }: GroupPrepSessionProps) {
	const queryClient = useQueryClient();
	const [newTask, setNewTask] = useState({
		title: '',
		description: '',
		assignedTo: '',
	});

	const { data: session, isLoading } = useQuery<Session>({
		queryKey: ['group-prep-session', sessionId],
		queryFn: async () => {
			const res = await fetch(`/api/social/group-prep?sessionId=${sessionId}`);
			const data = await res.json();
			return data.sessions[0];
		},
	});

	const updateTaskMutation = useMutation({
		mutationFn: async ({
			taskId,
			status,
		}: {
			taskId: string;
			status: string;
		}) => {
			const res = await fetch(`/api/social/group-prep/tasks`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ taskId, status }),
			});
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['group-prep-session', sessionId],
			});
		},
	});

	const createTaskMutation = useMutation({
		mutationFn: async (task: {
			title: string;
			description: string;
			assignedTo: string;
		}) => {
			const res = await fetch(`/api/social/group-prep/tasks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...task, sessionId }),
			});
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['group-prep-session', sessionId],
			});
			setNewTask({ title: '', description: '', assignedTo: '' });
		},
	});

	if (isLoading || !session) {
		return <div className='flex justify-center p-8'>Loading...</div>;
	}

	return (
		<div className='max-w-4xl mx-auto p-4'>
			<div className='bg-white rounded-lg shadow p-6 mb-6'>
				<h1 className='text-2xl font-bold mb-4'>{session.name}</h1>
				<p className='text-gray-600 mb-4'>{session.description}</p>

				<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
					<div className='flex items-center space-x-2'>
						<Calendar className='w-5 h-5 text-blue-500' />
						<span>{format(new Date(session.startTime), 'MMM d, yyyy')}</span>
					</div>
					<div className='flex items-center space-x-2'>
						<Clock className='w-5 h-5 text-green-500' />
						<span>
							{format(new Date(session.startTime), 'h:mm a')} -{' '}
							{format(new Date(session.endTime), 'h:mm a')}
						</span>
					</div>
					<div className='flex items-center space-x-2'>
						<Users className='w-5 h-5 text-purple-500' />
						<span>
							{session.participants.length}/{session.maxParticipants}{' '}
							participants
						</span>
					</div>
				</div>

				<div className='mb-6'>
					<h2 className='text-xl font-semibold mb-3'>Participants</h2>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						{session.participants.map((participant) => (
							<div
								key={participant.id}
								className='flex items-center space-x-2 p-2 bg-gray-50 rounded'
							>
								<Image
									src={participant.user.image || '/default-avatar.png'}
									alt={participant.user.name}
									width={32}
									height={32}
									className='rounded-full'
								/>
								<div>
									<p className='font-medium'>{participant.user.name}</p>
									<p className='text-sm text-gray-500'>{participant.role}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				<div>
					<h2 className='text-xl font-semibold mb-3'>Tasks</h2>
					<div className='space-y-4'>
						{session.tasks.map((task) => (
							<div
								key={task.id}
								className='flex items-center justify-between p-4 bg-gray-50 rounded'
							>
								<div>
									<h3 className='font-medium'>{task.title}</h3>
									<p className='text-sm text-gray-600'>{task.description}</p>
									<p className='text-sm text-gray-500'>
										Assigned to:{' '}
										{
											session.participants.find(
												(p) => p.userId === task.assignedTo
											)?.user.name
										}
									</p>
								</div>
								<div className='flex items-center space-x-2'>
									{task.status === 'completed' ? (
										<CheckCircle className='w-5 h-5 text-green-500' />
									) : (
										<button
											onClick={() =>
												updateTaskMutation.mutate({
													taskId: task.id,
													status: 'completed',
												})
											}
											className='text-gray-500 hover:text-green-500'
										>
											<XCircle className='w-5 h-5' />
										</button>
									)}
								</div>
							</div>
						))}

						<div className='mt-4 p-4 bg-gray-50 rounded'>
							<h3 className='font-medium mb-3'>Add New Task</h3>
							<div className='space-y-3'>
								<input
									type='text'
									placeholder='Task title'
									value={newTask.title}
									onChange={(e) =>
										setNewTask({ ...newTask, title: e.target.value })
									}
									className='w-full p-2 border rounded'
								/>
								<textarea
									placeholder='Task description'
									value={newTask.description}
									onChange={(e) =>
										setNewTask({ ...newTask, description: e.target.value })
									}
									className='w-full p-2 border rounded'
								/>
								<select
									value={newTask.assignedTo}
									onChange={(e) =>
										setNewTask({ ...newTask, assignedTo: e.target.value })
									}
									className='w-full p-2 border rounded'
								>
									<option value=''>Assign to...</option>
									{session.participants.map((participant) => (
										<option
											key={participant.id}
											value={participant.userId}
										>
											{participant.user.name}
										</option>
									))}
								</select>
								<button
									onClick={() => createTaskMutation.mutate(newTask)}
									className='w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600'
								>
									Add Task
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
