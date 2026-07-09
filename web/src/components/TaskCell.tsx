import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { useState } from 'react';

const TASK_TRUNCATE_LENGTH = 100;

/**
 * Renders an OT request's task text: linkifies the first URL and, when the text
 * is long, truncates it with a "View all" / "Show less" toggle. Shared by the
 * My OT history table and the admin views so they stay consistent.
 */
export function TaskCell({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > TASK_TRUNCATE_LENGTH;

  // Break long unbroken strings (e.g. task URLs) so they wrap inside the cell
  // instead of overflowing into the next column.
  return (
    <Box component="span" sx={{ display: 'block', overflowWrap: 'anywhere' }}>
      {isLong && !expanded ? (
        <>
          {linkify(`${text.slice(0, TASK_TRUNCATE_LENGTH).trimEnd()}…`)}{' '}
          <Link component="button" type="button" variant="body2" onClick={() => setExpanded(true)}>
            View all
          </Link>
        </>
      ) : (
        <>
          {linkify(text)}
          {isLong && (
            <>
              {' '}
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => setExpanded(false)}
              >
                Show less
              </Link>
            </>
          )}
        </>
      )}
    </Box>
  );
}

function linkify(text: string) {
  const urlMatch = text.match(/https?:\/\/\S+/);
  if (!urlMatch) return <>{text}</>;
  return (
    <>
      {text.split(urlMatch[0])[0]}
      <Link href={urlMatch[0]} target="_blank" rel="noreferrer">
        {urlMatch[0]}
      </Link>
      {text.split(urlMatch[0])[1]}
    </>
  );
}
