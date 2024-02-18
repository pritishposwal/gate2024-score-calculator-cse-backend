import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link, Box } from '@mui/material';
import { FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa';
import { IconButton } from '@mui/material';
function App() {
  const [link, setLink] = useState('');
  const [results, setResults] = useState(null);

  const handleCalculateMarks = async () => {
    const response = await fetch('http://localhost:3000/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      //print the link to the console

      body: JSON.stringify({ sheetUrl: link })
    });
    const data = await response.json();
    setResults(data);
  }
  const renderQuestionDetails = () => {
    if (!results || !results.detailedResults) {
      return null;
    }

    return (
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table aria-label="question details">
          <TableHead>
            <TableRow>
              <TableCell>Question</TableCell>
              <TableCell align="right">Status</TableCell>
              <TableCell align="right">Marks Obtained</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.detailedResults.map((detail, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  {`Question ${detail.questionNo}`}
                </TableCell>
                <TableCell align="right">{detail.statusque}</TableCell>
                <TableCell align="right">{detail.marksObtained}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  return (
  <Box display="flex" flexDirection="column" minHeight="100vh">
    <Container maxWidth="md" component="main" sx={{ flex: '1 0 auto' }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mt: 4 }}> 
        GATE 2024 CSE Marks Calculator S2
      </Typography>
      <Typography variant="subtitle1" gutterBottom align="center" sx={{fontWeight: 'bold', fontSize: '1.1rem'}}>
        Developed by Pritish Poswal
      </Typography>
      <Box my={4} display="flex" justifyContent="center">
        <IconButton onClick={() => window.open('https://twitter.com/pritishposwal')}>
          <FaTwitter size={30} />
        </IconButton>
        <IconButton onClick={() => window.open('https://github.com/pritishposwal')}>
          <FaGithub size={30} />
        </IconButton>
        <IconButton onClick={() => window.open('https://linkedin.com/in/pritishposwal')}>
          <FaLinkedin size={30} />
        </IconButton>
      </Box>
      <TextField
        fullWidth
        label="Response Sheet Link"
        variant="outlined"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        margin="normal"
      />
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handleCalculateMarks}
        sx={{ padding: '8px', marginTop: '20px' , fontSize: '1.5rem'}}
      >
        Calculate Marks
      </Button>
      {results && (
        <TableContainer component={Paper} style={{ marginTop: '20px' }}>
          <Table aria-label="results table">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="right">Positive Marks</TableCell>
                <TableCell align="right">Negative Marks</TableCell>
                <TableCell align="right">Attempted</TableCell>
                <TableCell align="right">Correct</TableCell>
                <TableCell align="right">Incorrect</TableCell>
                <TableCell align="right">Total Marks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow key="aptitude">
                <TableCell component="th" scope="row">
                  Aptitude
                </TableCell>
                <TableCell align="right">{results.aptitudeScore.positive}</TableCell>
                <TableCell align="right">{results.aptitudeScore.negative}</TableCell>
                <TableCell align="right">{results.aptitudeScore.attempted}</TableCell>
                <TableCell align="right">{results.aptitudeScore.correct}</TableCell>
                <TableCell align="right">{results.aptitudeScore.incorrect}</TableCell>
                <TableCell align="right">{results.aptitudeScore.total}</TableCell>
              </TableRow>
              <TableRow key="core">
                <TableCell component="th" scope="row">
                  Core
                </TableCell>
                <TableCell align="right">{results.coreScore.positive}</TableCell>
                <TableCell align="right">{results.coreScore.negative}</TableCell>
                <TableCell align="right">{results.coreScore.attempted}</TableCell>
                <TableCell align="right">{results.coreScore.correct}</TableCell>
                <TableCell align="right">{results.coreScore.incorrect}</TableCell>
                <TableCell align="right">{results.coreScore.total}</TableCell>
              </TableRow>
              <TableRow key="combined">
                <TableCell component="th" scope="row">
                  Combined
                </TableCell>
                <TableCell align="right">{results.combinedScore.positive}</TableCell>
                <TableCell align="right">{results.combinedScore.negative}</TableCell>
                <TableCell align="right">{results.combinedScore.attempted}</TableCell>
                <TableCell align="right">{results.combinedScore.correct}</TableCell>
                <TableCell align="right">{results.combinedScore.incorrect}</TableCell>
                <TableCell align="right">{results.combinedScore.total}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {renderQuestionDetails()}
    </Container>
    <Box component="footer" sx={{ bgcolor: '#3FADA8', color: 'white', py: 2, mt: 'auto', width: '100%'}}>
        <Typography variant="body2" align="center" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}> 
          © 2024 Developed by Pritish Poswal
        </Typography>
    </Box>
  </Box>
  );
}

export default App;
