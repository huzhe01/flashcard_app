export const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], data: [] };

  // Detect delimiter
  const delimiter = text.includes(',') ? ',' : ';';

  const parseLine = (line) => {
    const row = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim().replace(/^"|"$/g, ''));
    return row;
  };

  const headers = parseLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row = parseLine(line);
    if (row.length === headers.length) {
      data.push(row);
    }
  }

  return { headers, data };
};
