<template>
	<div class="p-6">
		<div class="flex items-center justify-between mb-6">
			<div class="flex items-center space-x-3">
				<button @click="$router.push('/')" class="text-green-600 hover:text-green-800 transition">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
					</svg>
				</button>
				<h1 class="text-3xl font-bold">📥 Quản lý consumer</h1>
			</div>
			<button @click="fetchDataAndLogs" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
				</svg>
				<span>Refresh</span>
			</button>
		</div>

		<div v-if="loading" class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
		</div>

		<div v-else>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
					<div class="flex items-center justify-between mb-2">
						<p class="text-sm text-gray-600">Total Messages</p>
						<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V8"/></svg>
					</div>
					<p class="text-3xl font-bold text-green-600">{{ formatNumber(statistics.totalMessages) }}</p>
				</div>
				<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
					<div class="flex items-center justify-between mb-2">
						<p class="text-sm text-gray-600">Processed</p>
						<svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
					</div>
					<p class="text-3xl font-bold text-blue-600">{{ formatNumber(statistics.processedMessages) }}</p>
				</div>
				<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
					<div class="flex items-center justify-between mb-2">
						<p class="text-sm text-gray-600">Success Rate</p>
						<svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
					</div>
					<p class="text-3xl font-bold text-purple-600">{{ successRate }}%</p>
				</div>
				<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
					<div class="flex items-center justify-between mb-2">
						<p class="text-sm text-gray-600">Failed Messages</p>
						<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
					</div>
					<p class="text-3xl font-bold text-red-600">{{ formatNumber(statistics.failedMessages) }}</p>
				</div>
			</div>

			<ConsumerList
				ref="consumerList"
				:consumerInstances="consumerInstances"
				@consumer-created="fetchConsumerData"
				@start-stop-polling="fetchConsumerData"
				@consumer-stopped="fetchConsumerData"
				@consumer-resumed="fetchConsumerData"
				@consumer-deleted="fetchConsumerData"
			/>

			<div class="bg-white rounded-lg shadow-md p-6 mt-8">
				<h2 class="text-2xl font-bold mb-4 flex items-center">
					<svg class="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
					Consumer Logs
				</h2>
				
				<div class="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
					<div class="flex gap-2 w-full md:w-auto">
						<input v-model="searchId" type="text" placeholder="Tìm Log ID..." class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none w-full" @keyup.enter="searchLogById">
						<button @click="searchLogById" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50" :disabled="searching">
							{{ searching ? '...' : 'Tìm' }}
						</button>
					</div>
					<div class="flex gap-2 w-full md:w-auto">
						<select v-model="filterStatus" @change="fetchAllLogs" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none w-full">
							<option value="">Tất cả trạng thái</option>
							<option value="RECEIVED">Received</option>
							<option value="PROCESSING">Processing</option>
							<option value="PROCESSED">Processed</option>
							<option value="FAILED">Failed</option>
						</select>
					</div>
				</div>

				<div class="border rounded-lg overflow-hidden">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							<tr v-if="loadingLogs">
								<td colspan="5" class="px-6 py-4 text-center text-gray-500">Đang tải dữ liệu...</td>
							</tr>
							<tr v-else-if="allLogs.length === 0">
								<td colspan="5" class="px-6 py-4 text-center text-gray-500">Không có logs nào.</td>
							</tr>
							<tr v-for="log in allLogs" :key="log.id" class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{{ log.id.substring(0, 8) }}...</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusClass(log.status)">
										{{ log.status }}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ log.topic || 'N/A' }}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(log.createdAt) }}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<button @click="viewLogDetails(log.id)" class="text-green-600 hover:text-green-900">View</button>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				
				<div v-if="pagination" class="mt-4 flex justify-between items-center text-sm text-gray-600">
					<div>Hiển thị {{ allLogs.length }} / {{ pagination.total }} logs</div>
					<div>Trang {{ pagination.page }} / {{ pagination.totalPages }}</div>
				</div>
			</div>

			<div class="mt-6 text-center text-sm text-gray-500">
				<span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
				Live updates active (Polling every 5s)
			</div>
		</div>

		<div v-if="selectedLog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeLogDetail">
			<div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
				<div class="p-6 border-b flex justify-between items-center">
					<h3 class="text-xl font-bold">Chi tiết Log</h3>
					<button @click="closeLogDetail" class="text-gray-500 hover:text-gray-700">✕</button>
				</div>
				<div class="p-6 overflow-y-auto">
					<pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{{ JSON.stringify(selectedLog, null, 2) }}</pre>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { getConsumerStats, getConsumerLogs, getConsumerLogById } from "@/services/apiService";
import ConsumerList from "@/components/common/ConsumerList.vue";

export default {
	name: "ConsumerDashboardView",
	components: { ConsumerList },
	data() {
		return {
			loading: true,
			loadingLogs: false,
			statistics: { totalMessages: 0, processedMessages: 0, failedMessages: 0, activeConsumers: 0 },
			allLogs: [],
			pagination: null,
			filterStatus: '',
			searchId: '',
			searching: false,
			selectedLog: null,
			consumerInstances: [],
			pollingIntervalId: null,
		};
	},
	computed: {
		successRate() {
			if (this.statistics.totalMessages === 0) return 0;
			return Math.round((this.statistics.processedMessages / this.statistics.totalMessages) * 100);
		}
	},
	async mounted() {
		await this.fetchDataAndLogs();
		this.startPolling();
	},
	beforeUnmount() {
		if (this.pollingIntervalId) clearInterval(this.pollingIntervalId);
	},
	methods: {
		async fetchDataAndLogs() {
			await this.fetchConsumerData();
			await this.fetchAllLogs();
		},
		startPolling() {
			if (this.pollingIntervalId) clearInterval(this.pollingIntervalId);
			this.pollingIntervalId = setInterval(async () => {
				await this.fetchConsumerData();
				// Không auto-refresh logs để tránh giật UI khi đang xem
			}, 5000);
		},
		async fetchConsumerData() {
			try {
				const res = await getConsumerStats();
				if (res.success) {
					this.statistics = {
						totalMessages: res.totalMessages || 0,
						processedMessages: res.processedMessages || 0,
						failedMessages: res.failedMessages || 0,
						activeConsumers: res.activeConsumers || 0,
					};
					this.consumerInstances = (res.instances || []).map(i => ({
						...i,
						consumerId: i.id || i.consumerId,
						status: (i.status || "").toLowerCase()
					}));
				}
			} catch (e) { console.error(e); } 
			finally { this.loading = false; }
		},
		async fetchAllLogs() {
			this.loadingLogs = true;
			try {
				const params = { page: 1, limit: 50 };
				if (this.filterStatus) params.status = this.filterStatus;
				const res = await getConsumerLogs(params);
				if (res.success) {
					this.allLogs = res.data || [];
					this.pagination = res.pagination;
				}
			} catch (e) { console.error(e); } 
			finally { this.loadingLogs = false; }
		},
		async searchLogById() {
			if (!this.searchId) return;
			this.searching = true;
			try {
				const res = await getConsumerLogById(this.searchId);
				if (res.success) this.selectedLog = res.data;
				else alert(res.message || 'Không tìm thấy');
			} catch (e) { alert('Lỗi tìm kiếm'); } 
			finally { this.searching = false; }
		},
		viewLogDetails(id) { this.searchId = id; this.searchLogById(); },
		closeLogDetail() { this.selectedLog = null; },
		getStatusClass(status) {
			const map = { RECEIVED: 'bg-yellow-100 text-yellow-800', PROCESSED: 'bg-green-100 text-green-800', FAILED: 'bg-red-100 text-red-800', PROCESSING: 'bg-blue-100 text-blue-800' };
			return map[status] || 'bg-gray-100 text-gray-800';
		},
		formatNumber(n) { return n?.toLocaleString() || 0; },
		formatDate(d) { return d ? new Date(d).toLocaleString('vi-VN') : 'N/A'; }
	}
};
</script>