<template>
  <LayoutHeader>
    <template #left-header>
      <ViewBreadcrumbs v-model="viewControls" routeName="Meetings" />
    </template>
    <template #right-header>
      <CustomActions
        v-if="meetingsListView?.customListActions"
        :actions="meetingsListView.customListActions"
      />
    </template>
  </LayoutHeader>
  <ViewControls
    ref="viewControls"
    v-model="meetings"
    v-model:loadMore="loadMore"
    v-model:resizeColumn="triggerResize"
    v-model:updatedPageCount="updatedPageCount"
    doctype="CRM Meeting"
  />
  <MeetingsListView
    v-if="meetings.data && rows.length"
    ref="meetingsListView"
    v-model="meetings.data.page_length_count"
    v-model:list="meetings"
    :rows="rows"
    :columns="columns"
    :options="{
      showTooltip: false,
      resizeColumn: true,
      rowCount: meetings.data.row_count,
      totalCount: meetings.data.total_count,
    }"
    @loadMore="() => loadMore++"
    @columnWidthUpdated="() => triggerResize++"
    @updatePageCount="(count) => (updatedPageCount = count)"
    @applyFilter="(data) => viewControls.applyFilter(data)"
    @applyLikeFilter="(data) => viewControls.applyLikeFilter(data)"
    @likeDoc="(data) => viewControls.likeDoc(data)"
    @selectionsChanged="
      (selections) => viewControls.updateSelections(selections)
    "
  />
  <EmptyState
    v-else-if="meetings.data && !rows.length"
    name="Meetings"
    :icon="CalendarIcon"
  />
</template>
<script setup>
import ViewBreadcrumbs from '@/components/ViewBreadcrumbs.vue'
import CustomActions from '@/components/CustomActions.vue'
import CalendarIcon from '@/components/Icons/CalendarIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import MeetingsListView from '@/components/ListViews/MeetingsListView.vue'
import ViewControls from '@/components/ViewControls.vue'
import EmptyState from '@/components/ListViews/EmptyState.vue'
import { formatDate } from '@/utils'
import { timestampCell } from '@/composables/useTimelinePreferences'
import { ref, computed } from 'vue'

const meetingsListView = ref(null)

// meetings data is loaded in the ViewControls component
const meetings = ref({})
const loadMore = ref(1)
const triggerResize = ref(1)
const updatedPageCount = ref(20)
const viewControls = ref(null)

// There is no Create button on this page. Meetings are captured by the
// BrassHelm OS and filed against a lead; one typed in by hand would be a
// record of a meeting nobody recorded.

const rows = computed(() => {
  if (
    !meetings.value?.data?.data ||
    !['list', 'group_by'].includes(meetings.value.data.view_type)
  )
    return []

  return meetings.value?.data.data.map((meeting) => {
    let _rows = {}
    meetings.value?.data.rows.forEach((row) => {
      _rows[row] = meeting[row]

      let fieldType = meetings.value?.data.columns?.find(
        (col) => (col.key || col.value) == row,
      )?.type

      if (
        fieldType &&
        ['Date', 'Datetime'].includes(fieldType) &&
        !['modified', 'creation'].includes(row)
      ) {
        _rows[row] = formatDate(meeting[row], '', true, fieldType == 'Datetime')
      }

      if (['modified', 'creation'].includes(row)) {
        _rows[row] = timestampCell(meeting[row])
      }
    })
    return _rows
  })
})

const columns = computed(() => {
  let _columns = meetings.value?.data?.columns || []

  // Set align right for last column
  if (_columns.length) {
    _columns = _columns.map((col, index) => {
      if (index === _columns.length - 1) {
        return { ...col, align: 'right' }
      }
      return col
    })
  }

  return _columns
})
</script>
