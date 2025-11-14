<template>
	<div class="bg-white rounded-lg shadow-md p-6">
		<!-- Header với button Add -->
		<div class="flex items-center justify-between mb-6">
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
				>
					<svg
						class="w-6 h-6 text-green-600"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
						/>
					</svg>
				</div>
				<div>
					<h2 class="text-xl font-bold text-gray-800">
						👥 Consumer Management
					</h2>
					<p class="text-sm text-gray-500">
						{{ totalConsumers }} consumers ({{ activeConsumers }} active)
					</p>
				</div>
			</div>

			<button
				@click="openAddModal"
				class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg"
			>
				<svg
					class="w-5 h-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
				<span>Add Consumer</span>
			</button>
		</div>

		<!-- Search and Filter Bar -->
		<div class="mb-6 flex flex-col sm:flex-row gap-4">
			<!-- Search Input -->
			<div class="flex-1">
				<div class="relative">
					<div
						class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
					>
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</div>
					<input
						v-model="searchQuery"
						type="text"
						placeholder="Search by Consumer ID, hostname, or PID..."
						class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
					/>
					<div
						v-if="searchQuery"
						class="absolute inset-y-0 right-0 pr-3 flex items-center"
					>
						<button
							@click="clearSearch"
							class="text-gray-400 hover:text-gray-600"
						>
							<svg
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>

			<!-- Status Filter -->
			<div class="flex gap-2">
				<select
					v-model="statusFilter"
					class="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
				>
					<option value="all">All Status</option>
					<option value="active">Active Only</option>
					<option value="inactive">Inactive Only</option>
				</select>

				<!-- Items per page -->
				<select
					v-model="itemsPerPage"
					class="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
				>
					<option :value="6">6 per page</option>
					<option :value="12">12 per page</option>
					<option :value="24">24 per page</option>
					<option :value="50">50 per page</option>
				</select>
			</div>
		</div>

		<!-- Loading State -->
		<div v-if="loading" class="text-center py-8">
			<svg
				class="animate-spin h-8 w-8 text-green-600 mx-auto"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			<p class="text-gray-500 mt-2">Loading consumers...</p>
		</div>

		<!-- Search Results Info -->
		<div v-if="!loading && filteredConsumers.length > 0" class="mb-4">
			<div class="flex justify-between items-center text-sm text-gray-600">
				<div>
					<span v-if="searchQuery || statusFilter !== 'all'">
						Found {{ filteredConsumers.length }} result(s)
						<span v-if="searchQuery">for "{{ searchQuery }}"</span>
						<span v-if="statusFilter !== 'all'"
							>with status "{{ statusFilter }}"</span
						>
					</span>
					<span v-else>
						Showing {{ startIndex + 1 }}-{{
							Math.min(endIndex, totalConsumers)
						}}
						of {{ totalConsumers }} consumers
					</span>
				</div>
				<div class="text-xs">Page {{ currentPage }} of {{ totalPages }}</div>
			</div>
		</div>

		<!-- Consumer Cards Grid -->
		<div
			v-if="!loading && filteredConsumers.length > 0"
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
		>
			<div
				v-for="consumer in paginatedConsumers"
				:key="consumer.consumerId"
				:class="[
					'border-2 rounded-lg p-4 transition-all',
					consumer.status === 'active'
						? 'border-green-200 bg-green-50 hover:shadow-lg'
						: consumer.status === 'stopping'
						? 'border-yellow-200 bg-yellow-50 hover:shadow-lg'
						: consumer.status === 'creating'
						? 'border-blue-200 bg-blue-50 hover:shadow-lg'
						: 'border-red-200 bg-red-50 hover:shadow-lg',
				]"
			>
				<!-- Consumer Header -->
				<div class="flex items-start justify-between mb-3">
					<div class="flex items-center gap-3">
						<div
							:class="[
								'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg',
								consumer.status === 'active'
									? 'bg-green-500'
									: consumer.status === 'creating'
									? 'bg-blue-500'
									: consumer.status === 'stopping'
									? 'bg-yellow-500'
									: 'bg-red-500',
							]"
						>
							<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div>
							<h3 class="font-bold text-gray-800 truncate">
								{{ consumer.consumerId }}
							</h3>
							<div class="flex items-center gap-1 mt-1">
								<div
									:class="[
										'w-2 h-2 rounded-full animate-pulse',
										consumer.status === 'active'
											? 'bg-green-500'
											: consumer.status === 'creating'
											? 'bg-blue-500'
											: consumer.status === 'stopping'
											? 'bg-yellow-500'
											: 'bg-red-500',
									]"
								></div>
								<span
									:class="[
										'text-xs font-medium',
										consumer.status === 'active'
											? 'text-green-700'
											: consumer.status === 'creating'
											? 'text-blue-700'
											: consumer.status === 'stopping'
											? 'text-yellow-700'
											: 'text-red-700',
									]"
								>
									{{
										consumer.status === "active"
											? "Active"
											: consumer.status === "creating"
											? "Creating..."
											: consumer.status === "stopping"
											? "Stopping..."
											: "Inactive"
									}}
								</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Consumer Info -->
				<div class="space-y-2 mb-4">
					<div class="flex items-center text-sm text-gray-600">
						<svg
							class="w-4 h-4 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
							/>
						</svg>
						<span class="font-mono text-xs"
							>PID: {{ consumer.pid || "N/A" }}</span
						>
					</div>

					<div class="flex items-center text-sm text-gray-600">
						<svg
							class="w-4 h-4 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
						<span class="text-xs truncate">{{
							consumer.groupId || "default"
						}}</span>
					</div>

					<!-- ✅ Subscribed Topic -->
					<div class="flex items-center text-sm text-gray-600">
						<svg
							class="w-4 h-4 mr-2 text-blue-600"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
						</svg>
						<span 
							class="text-xs truncate"
							:class="consumer.topicName ? 'text-blue-700 font-medium' : 'text-gray-500'"
						>
							<span v-if="consumer.topicName" class="flex items-center gap-1">
								<span class="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
								{{ consumer.topicName }}
							</span>
							<span v-else class="italic">No topic assigned</span>
						</span>
					</div>

					<div
						v-if="consumer.startedAt"
						class="flex items-center text-sm text-gray-600"
					>
						<svg
							class="w-4 h-4 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span class="text-xs">{{ formatDate(consumer.startedAt) }}</span>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center gap-1">
					<!-- Stop Button (chỉ hiện khi consumer active) -->
					<button
						v-if="consumer.status === 'active'"
						@click="openStopModal(consumer.consumerId)"
						:disabled="stoppingConsumers.has(consumer.consumerId)"
						class="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-gray-400"
					>
						<svg
							v-if="stoppingConsumers.has(consumer.consumerId)"
							class="animate-spin h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						<svg
							v-else
							class="w-3 h-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{{
							stoppingConsumers.has(consumer.consumerId)
								? "Stopping..."
								: "Stop"
						}}</span>
					</button>

					<!-- Resume Button (chỉ hiện khi consumer inactive) -->
					<button
						v-if="consumer.status === 'inactive'"
						@click="openResumeModal(consumer.consumerId)"
						:disabled="resumingConsumers.has(consumer.consumerId)"
						class="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
					>
						<svg
							v-if="resumingConsumers.has(consumer.consumerId)"
							class="animate-spin h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						<svg
							v-else
							class="w-3 h-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{{
							resumingConsumers.has(consumer.consumerId)
								? "Resuming..."
								: "Resume"
						}}</span>
					</button>

					<!-- Delete Button (luôn hiện) -->
					<button
						@click="openDeleteModal(consumer.consumerId)"
						:disabled="deletingConsumers.has(consumer.consumerId)"
						class="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
					>
						<svg
							v-if="deletingConsumers.has(consumer.consumerId)"
							class="animate-spin h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						<svg
							v-else
							class="w-3 h-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
						<span>{{
							deletingConsumers.has(consumer.consumerId)
								? "Deleting..."
								: "Delete"
						}}</span>
					</button>
				</div>

				<!-- Info for Creating -->
				<div
					v-if="consumer.status === 'creating'"
					class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start"
				>
					<svg
						class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600 animate-spin"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<div>
						<div class="font-semibold">Consumer is being created</div>
						<div class="mt-1">
							Please wait while the consumer is starting up and connecting to
							the system.
						</div>
					</div>
				</div>

				<!-- Info for Stopping -->
				<div
					v-if="consumer.status === 'stopping'"
					class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 flex items-start"
				>
					<svg
						class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-600 animate-spin"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<div>
						<div class="font-semibold">Consumer is being stopped</div>
						<div class="mt-1">
							Please wait while the consumer is stopping and disconnecting from
							the system.
						</div>
					</div>
				</div>

				<!-- Warning for Inactive -->
				<div
					v-if="consumer.status === 'inactive'"
					class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 flex items-start"
				>
					<svg
						class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-600"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
					<div>
						<div class="font-semibold">Consumer is inactive</div>
						<div class="mt-1">
							Consumer stopped or no heartbeat detected. Click "Resume" to
							reactivate.
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Empty States -->
		<!-- No consumers at all -->
		<div v-if="!loading && consumers.length === 0" class="text-center py-12">
			<svg
				class="w-16 h-16 text-gray-300 mx-auto mb-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
			<p class="text-gray-500 text-lg mb-2">No consumers running</p>
			<p class="text-gray-400 text-sm">
				Click "Add Consumer" to start a new instance
			</p>
		</div>

		<!-- No search results -->
		<div
			v-else-if="
				!loading && consumers.length > 0 && filteredConsumers.length === 0
			"
			class="text-center py-12"
		>
			<svg
				class="w-16 h-16 text-gray-300 mx-auto mb-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
			<p class="text-gray-500 text-lg mb-2">No consumers found</p>
			<p class="text-gray-400 text-sm mb-4">
				<span v-if="searchQuery">No results for "{{ searchQuery }}"</span>
				<span v-if="searchQuery && statusFilter !== 'all'">
					with status "{{ statusFilter }}"</span
				>
				<span v-else-if="statusFilter !== 'all'"
					>No consumers with status "{{ statusFilter }}"</span
				>
			</p>
			<button
				@click="clearFilters"
				class="px-4 py-2 text-green-600 hover:text-green-800 text-sm font-medium border border-green-300 rounded-lg hover:bg-green-50 transition"
			>
				Clear filters
			</button>
		</div>

		<!-- Pagination -->
		<div
			v-if="!loading && filteredConsumers.length > 0 && totalPages > 1"
			class="flex items-center justify-between mt-6"
		>
			<!-- Page Info -->
			<div class="text-sm text-gray-700">
				Showing
				<span class="font-medium">{{ startIndex + 1 }}</span>
				to
				<span class="font-medium">{{
					Math.min(endIndex, filteredConsumers.length)
				}}</span>
				of
				<span class="font-medium">{{ filteredConsumers.length }}</span>
				results
			</div>

			<!-- Pagination Controls -->
			<div class="flex items-center space-x-1">
				<!-- Previous Button -->
				<button
					@click="goToPage(currentPage - 1)"
					:disabled="currentPage === 1"
					:class="[
						'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
						currentPage === 1
							? 'text-gray-400 cursor-not-allowed'
							: 'text-gray-700 hover:text-green-600 hover:bg-green-50',
					]"
				>
					<svg
						class="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>

				<!-- Page Numbers -->
				<div class="flex items-center space-x-1">
					<button
						v-for="pageNum in visiblePages"
						:key="pageNum"
						@click="goToPage(pageNum)"
						:class="[
							'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
							pageNum === currentPage
								? 'bg-green-600 text-white'
								: 'text-gray-700 hover:text-green-600 hover:bg-green-50',
						]"
					>
						{{ pageNum }}
					</button>
				</div>

				<!-- Next Button -->
				<button
					@click="goToPage(currentPage + 1)"
					:disabled="currentPage === totalPages"
					:class="[
						'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
						currentPage === totalPages
							? 'text-gray-400 cursor-not-allowed'
							: 'text-gray-700 hover:text-green-600 hover:bg-green-50',
					]"
				>
					<svg
						class="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Add Consumer Modal -->
		<AddConsumerModal
			:isOpen="showAddModal"
			@close="closeAddModal"
			@consumer-created="handleConsumerCreated"
		/>

		<!-- Stop Consumer Confirmation Modal -->
		<ConfirmModal
			:show="showStopModal"
			type="warning"
			title="Stop Consumer"
			message="The consumer will be marked as INACTIVE but the record will remain in the database."
			:consumerId="selectedConsumerId"
			confirmText="Stop"
			@confirm="confirmStop"
			@close="showStopModal = false"
		/>

		<!-- Resume Consumer Confirmation Modal -->
		<ConfirmModal
			:show="showResumeModal"
			type="resume"
			title="Resume Consumer"
			message="The consumer will be marked as ACTIVE and start processing messages again."
			:consumerId="selectedConsumerId"
			confirmText="Resume"
			@confirm="confirmResume"
			@close="showResumeModal = false"
		/>

		<!-- Delete Consumer Confirmation Modal -->
		<ConfirmModal
			:show="showDeleteModal"
			type="danger"
			title="Delete Consumer"
			message="This will PERMANENTLY remove the consumer from the database."
			:consumerId="selectedConsumerId"
			confirmText="Delete"
			@confirm="confirmDelete"
			@close="showDeleteModal = false"
		/>
	</div>
</template>

<script>
import {
	stopConsumer,
	resumeConsumer,
	deleteConsumer,
} from "@/services/apiService";
import AddConsumerModal from "./AddConsumerModal.vue";
import ConfirmModal from "./ConfirmModal.vue";
import { useToast } from "@/composables/useToast";

export default {
	name: "ConsumerList",
	components: {
		AddConsumerModal,
		ConfirmModal,
	},
	setup() {
		const { success, error } = useToast();
		return { toastSuccess: success, toastError: error };
	},
	props: {
		consumerInstances: {
			type: Array,
			default: () => [],
		},
	},
	data() {
		return {
			loading: false,
			showAddModal: false,
			stoppingConsumers: new Set(),
			resumingConsumers: new Set(),
			deletingConsumers: new Set(),
			// Search and Pagination
			searchQuery: "",
			statusFilter: "all", // 'all', 'active', 'inactive'
			currentPage: 1,
			itemsPerPage: 6, // Default 6 per page as requested
			// Confirm modals
			showStopModal: false,
			showResumeModal: false,
			showDeleteModal: false,
			selectedConsumerId: null,
		};
	},
	computed: {
		// Basic consumer data
		consumers() {
			return this.consumerInstances || [];
		},

		// Filtered consumers based on search and status
		filteredConsumers() {
			let filtered = [...this.consumers];

			// Filter by search query
			if (this.searchQuery.trim()) {
				const query = this.searchQuery.toLowerCase().trim();
				filtered = filtered.filter(
					(consumer) =>
						consumer.consumerId?.toLowerCase().includes(query) ||
						consumer.hostname?.toLowerCase().includes(query) ||
						consumer.pid?.toString().includes(query) ||
						consumer.groupId?.toLowerCase().includes(query)
				);
			}

			// Filter by status
			if (this.statusFilter !== "all") {
				filtered = filtered.filter(
					(consumer) => consumer.status?.toLowerCase() === this.statusFilter
				);
			}

			return filtered;
		},

		// Paginated consumers for current page
		paginatedConsumers() {
			const start = (this.currentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			return this.filteredConsumers.slice(start, end);
		},

		// Pagination info
		totalConsumers() {
			return this.consumers.length;
		},

		activeConsumers() {
			return this.consumers.filter((c) => c.status === "active").length;
		},

		totalPages() {
			return Math.ceil(this.filteredConsumers.length / this.itemsPerPage);
		},

		startIndex() {
			return (this.currentPage - 1) * this.itemsPerPage;
		},

		endIndex() {
			return this.startIndex + this.itemsPerPage;
		},

		// Visible page numbers for pagination
		visiblePages() {
			const total = this.totalPages;
			const current = this.currentPage;
			const pages = [];

			if (total <= 7) {
				// Show all pages if total <= 7
				for (let i = 1; i <= total; i++) {
					pages.push(i);
				}
			} else {
				// Show smart pagination
				if (current <= 4) {
					// Show first 5 pages
					for (let i = 1; i <= 5; i++) {
						pages.push(i);
					}
					pages.push("...");
					pages.push(total);
				} else if (current >= total - 3) {
					// Show last 5 pages
					pages.push(1);
					pages.push("...");
					for (let i = total - 4; i <= total; i++) {
						pages.push(i);
					}
				} else {
					// Show current page with 2 neighbors
					pages.push(1);
					pages.push("...");
					for (let i = current - 1; i <= current + 1; i++) {
						pages.push(i);
					}
					pages.push("...");
					pages.push(total);
				}
			}

			return pages.filter(
				(p) => p !== "..." || pages.indexOf(p) === pages.lastIndexOf(p)
			);
		},
	},

	watch: {
		// Reset to page 1 when search or filter changes
		searchQuery() {
			this.currentPage = 1;
		},
		statusFilter() {
			this.currentPage = 1;
		},
		itemsPerPage() {
			this.currentPage = 1;
		},
	},
	mounted() {
		// Không cần fetch nữa, data được truyền từ parent qua props
	},
	beforeUnmount() {
		// Không cần cleanup interval nữa
	},
	methods: {
		// Open stop confirmation modal
		openStopModal(consumerId) {
			this.selectedConsumerId = consumerId;
			this.showStopModal = true;
		},
		// Confirm stop action
		async confirmStop() {
			const consumerId = this.selectedConsumerId;
			this.showStopModal = false;

			// Ngay lập tức hiển thị trạng thái "đang stop"
			this.stoppingConsumers.add(consumerId);

			// ✅ Emit event để parent bắt đầu polling cho stopping process
			this.$emit("start-stop-polling", consumerId);

			try {
				const response = await stopConsumer(consumerId);

				if (response.success) {
					console.log(
						`🔄 Stop request sent for ${consumerId}, waiting for WebSocket confirmation...`
					);
					// KHÔNG emit event ngay, chờ WebSocket confirmation từ Consumer Service
					// KHÔNG xóa khỏi stoppingConsumers, sẽ xóa khi nhận WebSocket event
				} else {
					this.toastError(`Failed to stop consumer: ${response.message}`);
					// Chỉ xóa khỏi stoppingConsumers khi thất bại
					this.stoppingConsumers.delete(consumerId);
				}
			} catch (error) {
				console.error("Error stopping consumer:", error);
				this.toastError(`Error: ${error.message}`);
				// Chỉ xóa khỏi stoppingConsumers khi có lỗi
				this.stoppingConsumers.delete(consumerId);
			}
		},
		// Open resume confirmation modal
		openResumeModal(consumerId) {
			this.selectedConsumerId = consumerId;
			this.showResumeModal = true;
		},
		// Confirm resume action
		async confirmResume() {
			const consumerId = this.selectedConsumerId;
			this.showResumeModal = false;

			this.resumingConsumers.add(consumerId);

			try {
				const response = await resumeConsumer(consumerId);

				if (response.success) {
					// Emit event để parent handle, không cần fetch
					this.$emit("consumer-resumed", consumerId);
					console.log(`✅ Consumer ${consumerId} resumed successfully`);
				} else {
					this.toastError(`Failed to resume consumer: ${response.message}`);
				}
			} catch (error) {
				console.error("Error resuming consumer:", error);
				this.toastError(`Error: ${error.message}`);
			} finally {
				this.resumingConsumers.delete(consumerId);
			}
		},
		// Open delete confirmation modal
		openDeleteModal(consumerId) {
			this.selectedConsumerId = consumerId;
			this.showDeleteModal = true;
		},
		// Confirm delete action
		async confirmDelete() {
			const consumerId = this.selectedConsumerId;
			this.showDeleteModal = false;

			// Ngay lập tức hiển thị trạng thái "đang delete"
			this.deletingConsumers.add(consumerId);

			try {
				const response = await deleteConsumer(consumerId);

				if (response.success) {
					console.log(
						`🔄 Delete request sent for ${consumerId}, waiting for WebSocket confirmation...`
					);
					// KHÔNG emit event ngay, chờ WebSocket confirmation từ Consumer Service
					// KHÔNG xóa khỏi deletingConsumers, sẽ xóa khi nhận WebSocket event
				} else {
					this.toastError(`Failed to delete consumer: ${response.message}`);
					// Chỉ xóa khỏi deletingConsumers khi thất bại
					this.deletingConsumers.delete(consumerId);
				}
			} catch (error) {
				console.error("Error deleting consumer:", error);
				this.toastError(`Error: ${error.message}`);
				// Chỉ xóa khỏi deletingConsumers khi có lỗi
				this.deletingConsumers.delete(consumerId);
			}
		},
		openAddModal() {
			this.showAddModal = true;
		},
		closeAddModal() {
			this.showAddModal = false;
		},
		handleConsumerCreated(data) {
			console.log("Consumer created:", data);
			// Emit event lên parent để parent handle việc refresh
			this.$emit("consumer-created", data);
		},
		formatDate(dateString) {
			if (!dateString) return "N/A";
			const date = new Date(dateString);
			const now = new Date();
			const diff = Math.floor((now - date) / 1000); // seconds

			if (diff < 60) return `${diff}s ago`;
			if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
			if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
			return date.toLocaleString();
		},

		// Search and Pagination Methods
		clearSearch() {
			this.searchQuery = "";
		},

		clearFilters() {
			this.searchQuery = "";
			this.statusFilter = "all";
			this.currentPage = 1;
		},

		goToPage(page) {
			if (page >= 1 && page <= this.totalPages) {
				this.currentPage = page;
			}
		},

		goToFirstPage() {
			this.currentPage = 1;
		},

		goToLastPage() {
			this.currentPage = this.totalPages;
		},

		// Method để parent component gọi khi nhận WebSocket confirmation
		handleConsumerStoppedConfirmation(consumerId) {
			// Xóa khỏi stoppingConsumers khi đã confirmed từ Consumer Service
			if (this.stoppingConsumers.has(consumerId)) {
				this.stoppingConsumers.delete(consumerId);
				console.log(`✅ Consumer ${consumerId} stop confirmed via WebSocket`);

				// Emit event để parent handle cập nhật data
				this.$emit("consumer-stopped", consumerId);
			}
		},

		handleConsumerDeletedConfirmation(consumerId) {
			// Xóa khỏi deletingConsumers khi đã confirmed từ Consumer Service
			if (this.deletingConsumers.has(consumerId)) {
				this.deletingConsumers.delete(consumerId);
				console.log(`✅ Consumer ${consumerId} delete confirmed via WebSocket`);

				// Emit event để parent handle cập nhật data
				this.$emit("consumer-deleted", consumerId);
			}
		},
	},
};
</script>
