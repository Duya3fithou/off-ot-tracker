import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { AdminProjectsTab } from '../components/admin/AdminProjectsTab';
import { AdminRequestsTab } from '../components/admin/AdminRequestsTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { AdminSummaryTab } from '../components/admin/AdminSummaryTab';

export function AdminPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Admin
      </Typography>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="OT requests" />
        <Tab label="Monthly summary" />
        <Tab label="Projects" />
        <Tab label="Settings" />
      </Tabs>

      {tab === 0 && <AdminRequestsTab />}
      {tab === 1 && <AdminSummaryTab />}
      {tab === 2 && <AdminProjectsTab />}
      {tab === 3 && <AdminSettingsTab />}
    </Box>
  );
}
