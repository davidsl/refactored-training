import React from 'react';
import ReusableTable, { type TableColumn } from '../../components/ReusableTable/ReusableTable';
import styles from '../StylingExamples.module.css';

type PreviewRow = {
  component: string;
  status: 'Ready' | 'Draft' | 'Review';
  owner: string;
};

const previewRows: PreviewRow[] = [
  { component: 'Hero Banner', status: 'Ready', owner: 'Ari' },
  { component: 'Leaderboard Panel', status: 'Review', owner: 'Mila' },
  { component: 'Settings Drawer', status: 'Draft', owner: 'Kai' },
  { component: 'Game Tile', status: 'Ready', owner: 'Nova' },
];

const previewColumns: Array<TableColumn<PreviewRow>> = [
  { key: 'component', header: 'Component' },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    render: value => {
      const status = String(value) as PreviewRow['status'];
      const badgeClass =
        status === 'Ready' ? styles.badgeReady : status === 'Review' ? styles.badgeReview : styles.badgeDraft;

      return <span className={`${styles.statusBadge} ${badgeClass}`}>{status}</span>;
    },
  },
  { key: 'owner', header: 'Owner', align: 'center' },
];

const TablePreviewPanel: React.FC = () => {
  return (
    <article className={styles.panel}>
      <h3>Table Preview</h3>
      <div className={styles.tableHolder}>
        <ReusableTable
          columns={previewColumns}
          rows={previewRows}
          caption="Component implementation status"
          emptyMessage="No components in preview."
        />
      </div>
    </article>
  );
};

export default TablePreviewPanel;
