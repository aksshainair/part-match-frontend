import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  CircularProgress,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Card,
  CardContent,
  Divider,
  Alert,
  Snackbar,
  IconButton
} from '@mui/material';
import { Upload as UploadIcon, Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [batchMatchTab, setBatchMatchTab] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [matchingResults, setMatchingResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // API base URL
  const API_BASE = 'https://part-match-backend.vercel.app';
  // const API_BASE = 'http://localhost:8000';
  // Fetch all documents
  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/documents`);
      setDocuments(response.data);
    } catch (error) {
      showSnackbar('Error fetching documents', 'error');
      console.error('Error fetching documents:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      showSnackbar('File uploaded successfully!', 'success');
      fetchDocuments();
    } catch (error) {
      showSnackbar('Error uploading file', 'error');
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
      event.target.value = null; // Reset file input
    }
  };

  // Handle batch matching
  const handleBatchMatch = async (docId) => {
    try {
      setLoading(true);
      setSelectedDocument(docId);
      const response = await axios.post(`${API_BASE}/batch-match/${docId}`);
      setMatchingResults(response.data);
      setTabValue(1); // Switch to results tab
      showSnackbar('Matching completed!', 'success');
    } catch (error) {
      showSnackbar('Error performing batch match', 'error');
      console.error('Error in batch match:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle single search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showSnackbar('Please enter a description to search', 'warning');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/single-match/`, {
        description: searchQuery,
      });
      console.log(response.data)
      setSearchResult(response.data);
    } catch (error) {
      showSnackbar('Error searching for part', 'error');
      console.error('Error in search:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Reset batch match tab when new results come in
  useEffect(() => {
    if (matchingResults) {
      // Only reset to Matched tab if there are matched items, otherwise show Unmatched
      setBatchMatchTab(matchingResults.matches.some(m => m.matched) ? 0 : 1);
    }
  }, [matchingResults]);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100vw',
        alignItems: 'center',
      }}>
        <AppBar position="static" sx={{ width: '100%' }}>
          <Toolbar>
            <Container sx={{ width: '100%' }}>
              <Typography variant="h6" component="div">
                Invoice Parts Matcher
              </Typography>
            </Container>
          </Toolbar>
        </AppBar>

        <Container 
          sx={{ 
            flex: 1,
            width: '100%',
            py: 4,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Upload Document
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}
                disabled={loading}
              >
                Upload PDF
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={handleFileUpload}
                />
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Upload an invoice or purchase order to process
            </Typography>
          </Paper>

          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab label="Documents" />
            <Tab label="Batch Match Results" disabled={!matchingResults} />
            <Tab label="Search Part" />
          </Tabs>

          {tabValue === 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Uploaded Documents
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Filename</TableCell>
                      <TableCell>Upload Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc._id}>
                        <TableCell>{doc.filename}</TableCell>
                        <TableCell>
                          {new Date(doc.upload_date).toLocaleString()}
                        </TableCell>
                        <TableCell>{doc.status}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleBatchMatch(doc._id)}
                            disabled={loading}
                          >
                            {loading && selectedDocument === doc._id ? (
                              <CircularProgress size={20} sx={{ mr: 1 }} />
                            ) : (
                              'Match Parts'
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {documents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No documents uploaded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {tabValue === 1 && matchingResults && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Batch Match Results
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Document: {matchingResults.document_id}
              </Typography>
              
              <Box mt={3} mb={3}>
                <Typography variant="subtitle1">
                  Matched: {matchingResults.matched_items} / {matchingResults.total_items} 
                  ({(matchingResults.match_rate * 100).toFixed(1)}%)
                </Typography>
              </Box>

              <Tabs
                value={batchMatchTab}
                onChange={(e, newValue) => setBatchMatchTab(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab 
                  label={`Matched (${matchingResults.matches.filter(m => m.matched).length})`} 
                  disabled={!matchingResults.matches.some(m => m.matched)} 
                />
                <Tab 
                  label={`Unmatched (${matchingResults.matches.filter(m => !m.matched).length})`} 
                  disabled={!matchingResults.matches.some(m => !m.matched)} 
                />
              </Tabs>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Line Item</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Matched Part</TableCell>
                      <TableCell>Part ID</TableCell>
                      <TableCell>Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matchingResults.matches
                      .filter(match => batchMatchTab === 0 ? match.matched : !match.matched)
                      .map((match, index) => (
                        <TableRow key={index}>
                          <TableCell>{match.line_item.line_number}</TableCell>
                          <TableCell>{match.line_item.description}</TableCell>
                          <TableCell>
                            {match.matched ? (match.best_match?.description || 'No description available') : 'No match found'}
                          </TableCell>
                          <TableCell>{match.best_match?.part_number || '-'}</TableCell>
                          <TableCell>
                            {match.matched ? `${(match.score * 100).toFixed(1)}%` : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {tabValue === 2 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Search for a Part
              </Typography>
              <Box display="flex" gap={2} mb={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Enter part description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                >
                  Search
                </Button>
              </Box>

              {searchResult && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Search Results
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box mb={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        SEARCHED FOR
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {searchResult.Invoice_Description || 'No description'}
                      </Typography>
                    </Box>
                    
                    {searchResult.Matched === 'Yes' && searchResult.Similarity_Score >= 0.6 ? (
                      <>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'rgba(46, 125, 50, 0.1)',
                          borderRadius: 1,
                          mb: 2
                        }}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 'bold' }}>
                              MATCH FOUND
                            </Typography>
                            <Box sx={{ 
                              ml: 'auto', 
                              bgcolor: 'success.dark',
                              color: 'white',
                              px: 1,
                              borderRadius: 1,
                              fontSize: '0.8rem'
                            }}>
                              {Math.round((searchResult.Similarity_Score || 0) * 100)}% Match
                            </Box>
                          </Box>
                          
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              {searchResult.Part_description || 'No description available'}
                            </Typography>
                            
                            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '120px 1fr', gap: 1 }}>
                              {searchResult.Document_Type && (
                                <>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Document Type:</strong>
                                  </Typography>
                                  <Typography variant="body2">
                                    {searchResult.Document_Type}
                                  </Typography>
                                </>
                              )}
                              
                              {searchResult.Document_ID && (
                                <>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Document ID:</strong>
                                  </Typography>
                                  <Typography variant="body2">
                                    {searchResult.Document_ID}
                                  </Typography>
                                </>
                              )}
                              {searchResult.Part_ID && (
                                <>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Part ID:</strong>
                                  </Typography>
                                  <Typography variant="body2">
                                    {searchResult.Part_ID}
                                  </Typography>
                                </>
                              )}
                              
                              <Typography variant="body2" color="text.secondary">
                                <strong>Unit of Measure:</strong>
                              </Typography>
                              <Typography variant="body2">
                                {searchResult.Unit_of_measure || 'N/A'}
                              </Typography>
                              
                              <Typography variant="body2" color="text.secondary">
                                <strong>Confidence:</strong>
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                  <Box 
                                    sx={{
                                      height: 8,
                                      borderRadius: 4,
                                      bgcolor: 'success.main',
                                      width: `${(searchResult.Similarity_Score || 0) * 100}%`,
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2" sx={{ minWidth: 40 }}>
                                  {((searchResult.Similarity_Score || 0) * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                        
                        <Alert severity="info" sx={{ mt: 2 }}>
                          This part was matched based on semantic similarity to your search query.
                        </Alert>
                      </>
                    ) : (
                      <Alert 
                        severity="warning" 
                        sx={{ 
                          '& .MuiAlert-message': { width: '100%' } 
                        }}
                      >
                        <Box>
                          <Typography fontWeight="medium" gutterBottom>
                            No exact match found
                          </Typography>
                          <Typography variant="body2">
                            We couldn't find a part that closely matches your search. 
                            Try using different keywords or check for typos.
                          </Typography>
                        </Box>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </Paper>
          )}
        </Container>

        <Box component="footer" sx={{ width: '100%', py: 2, textAlign: 'center' }}>
          <Container maxWidth="lg">
            <Typography variant="body2" color="text.secondary">
              Invoice Parts Matcher © {new Date().getFullYear()}
            </Typography>
          </Container>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App
