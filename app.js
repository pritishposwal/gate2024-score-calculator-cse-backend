const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
// Process.env.PORT is set by Heroku
const port = process.env.PORT || 3000;
app.use(express.json());
const fs = require('fs');
const cors = require('cors');
app.use(cors());

// Placeholder for loading the answer key synchronously at application start
let answerKey = []; // Make sure to replace this with actual loading logic

function calculateScore(questionsData,examType) {
    if (examType === "Shift1CSE"){
        answerKey = JSON.parse(fs.readFileSync('answerKeyUnacademyShift1.json', 'utf8'));
    }
    else if (examType === "Shift2CSE"){
        answerKey = JSON.parse(fs.readFileSync('answerKeyUnacademy.json', 'utf8'));
    }
    else if (examType === "DA"){
        answerKey = JSON.parse(fs.readFileSync('answerKeyUnacademyDA.json', 'utf8'));
    }
    let aptitudeScore = { positive: 0, negative: 0, attempted: 0, correct: 0, incorrect: 0, total: 0 };
    let coreScore = { positive: 0, negative: 0, attempted: 0, correct: 0, incorrect: 0, total: 0 };
    let detailedResults = [];
    // Define aptitude question ID ranges for 1 and 2 mark questions depending on the exam type
    if (examType === "Shift1CSE"){
        aptitudeOneMarkIDs = ["6420084898", "6420084899", "6420084900", "6420084901", "6420084902"];
        aptitudeTwoMarkIDs = ["6420084903", "6420084904", "6420084905", "6420084906", "6420084907"];
    }
    else if (examType === "Shift2CSE"){
        aptitudeOneMarkIDs = ["6420084963", "6420084964", "6420084965", "6420084966", "6420084967"];
        aptitudeTwoMarkIDs = ["6420084968", "6420084969", "6420084970", "6420084971", "6420084972"];
    }
    else if (examType === "DA"){
        aptitudeOneMarkIDs = ["6420085093", "6420085094", "6420085095", "6420085096", "6420085097"];
        aptitudeTwoMarkIDs = ["6420085098", "6420085099", "6420085100", "6420085101", "6420085102"];
    }

    questionsData.forEach((question,index)=> {
        const key = answerKey.find(k => k.questionId === question.questionId);
        let statusque = "Unattempted";
        let marksObtained = 0;
        let questionNo = index + 1;
        //console.log(key);
        if (!key) {
            console.error("Answer key not found for question ID:", question.questionId);
            return;
        }
        let isAptitude = aptitudeOneMarkIDs.includes(question.questionId) || aptitudeTwoMarkIDs.includes(question.questionId);
        let scoreValue;

        if (isAptitude) {
            scoreValue = aptitudeOneMarkIDs.includes(question.questionId) ? 1 : 2;
        } else {
            // Adjust scoreValue based on the index for core questions
            scoreValue = index >= 10 && index < 35 ? 1 : 2; // Use correct indices here
        }
        //score for the core subject is as per the following logic that first 25 questions are 1 mark and the rest are 2 marks
        let negativeMark = 0
        if(scoreValue === 1){
            negativeMark = 0.33;
        }
        else{
            negativeMark = 0.67;
        }
        let negativescorereturn = -1*negativeMark;
        let correct = false; // Flag to indicate if the answer was correct

        if (question.questionType === "MCQ") {
            //check if our response is empty then do nothing and add it to unattempted
            if (question.optionImageIds.length === 0) {
                statusque = "Unattempted";
                marksObtained = 0;
                detailedResults.push({ questionNo, statusque, marksObtained });
                return;
            }
            else if (key.correctAnswer.includes(question.optionImageIds[0])) {
                //console.log(key.correctAnswer, question.optionImageIds[0]);
                correct = true;
                statusque = "Correct";
                marksObtained = scoreValue;
                detailedResults.push({ questionNo, statusque, marksObtained });
            }
            else {
                statusque = "Incorrect";
                marksObtained = negativescorereturn;
                detailedResults.push({ questionNo, statusque, marksObtained });
            }
        } else if (question.questionType === "MSQ") {
            //print the correct option id from the answer key from the given question id
            //console.log(answerKey[question.questionId]);
            //check if our response is empty then do nothing and add it to unattempted
            if (question.optionImageIds.length === 0) {
                statusque = "Unattempted";
                marksObtained = 0;
                detailedResults.push({ questionNo, statusque, marksObtained });
                return;
            }
            else if (arraysEqual(question.optionImageIds.sort(), key.correctAnswer.sort())) {
                correct = true;
                statusque = "Correct";
                marksObtained = scoreValue;
                detailedResults.push({ questionNo, statusque, marksObtained });
            }
            else {
                statusque = "Incorrect";
                marksObtained = 0;
                detailedResults.push({ questionNo, statusque, marksObtained });
            }
        } else if (question.questionType === "NAT") {
            //console.log(question.givenAnswer, key.correctAnswer);
            //check if our response is empty then do nothing and add it to unattempted
            if (question.givenAnswer === "") {
                statusque = "Unattempted";
                marksObtained = 0;
                detailedResults.push({ questionNo, statusque, marksObtained });
                return;
            }
            else if (parseFloat(question.givenAnswer).toFixed(2) === parseFloat(key.correctAnswer).toFixed(2)) {
                //console.log(question.givenAnswer, key.correctAnswer);
                correct = true;
                statusque = "Correct";
                marksObtained = scoreValue;
                detailedResults.push({ questionNo, statusque, marksObtained });
            }
            else {
                statusque = "Incorrect";
                marksObtained = 0;
                detailedResults.push({ questionNo, statusque, marksObtained });
            }
        }

        let scoreSection = isAptitude ? aptitudeScore : coreScore;
        //check if the question is mcq then send flag as False else send flag as True
        if (question.questionType === "MCQ") {
            updateScore(scoreSection, scoreValue, negativeMark, correct, false);
        }
        else {
            updateScore(scoreSection, scoreValue, negativeMark, correct, true);
        }
        //detailedResults.push({ questionNo, statusque, marksObtained });
    });

    // Combine scores for the final result
    let combinedScore = combineScores(aptitudeScore, coreScore);
    // Return structured score results as json
    return { aptitudeScore, coreScore, combinedScore , detailedResults};
}

// Helper functions

function arraysEqual(a, b) {
    //console.log(a,b);
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

function updateScore(scoreSection, scoreValue, negativeMark, correct,flag) {
    scoreSection.attempted++;
    if (correct) {
        scoreSection.positive += scoreValue;
        scoreSection.correct++;
        scoreSection.total += scoreValue;
    } else {
        // Apply negative marking only for MCQ questions in the aptitude section
        // Assuming you pass a flag or modify the function to correctly identify MCQ questions and their section
        if (flag) {
            negativeMark = 0;
            scoreSection.incorrect++;
        }
        else{
            scoreSection.negative += negativeMark;
            scoreSection.total -= negativeMark;
            scoreSection.incorrect++;
        }
    }
}

function combineScores(aptitudeScore, coreScore) {
    return {
        positive: aptitudeScore.positive + coreScore.positive,
        negative: aptitudeScore.negative + coreScore.negative,
        attempted: aptitudeScore.attempted + coreScore.attempted,
        correct: aptitudeScore.correct + coreScore.correct,
        incorrect: aptitudeScore.incorrect + coreScore.incorrect,
        total: aptitudeScore.total + coreScore.total
    };
}

app.get('/', (req, res) => {
  res.send('GATE 2024 Score Calculator is running!');
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});


app.post('/calculate', async (req, res) => {
    const { sheetUrl, examType } = req.body; // Assuming the URL is sent in the request body
    
    try {
        const response = await axios.get(sheetUrl, {timeout: 20000}); // Fetch the response sheet
        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent); // Load the HTML content into Cheerio
        //write the html content to a notepad file please not html but ensure we output only first 2048 characters
        const fs = require('fs');
        //trim the html content to 1000 words
        //write the trimmed content to a notepad file
        fs.writeFile('gate2024.txt', htmlContent, (err) => {
            if (err) throw err;
            //console.log('The file has been saved!');
        });
        // Now you can use Cheerio to parse the HTML content
        // For example, let's say each question is within an element with class 'question'
        let questionsData = [];

        $('.question-pnl').each((i, elem) => {
            let questionId = $(elem).find('.menu-tbl td.bold').eq(1).text().trim();
            let questionType = $(elem).find('.menu-tbl td.bold').eq(0).text().trim();
            let chosenOptionText = $(elem).find('.menu-tbl td.bold').last().text().trim(); // "D" for MCQ, could be "A,D" etc. for MSQ
            
            let chosenOptions = chosenOptionText.split(',').map(opt => opt.trim()); // Ensure clean option letters for MSQ
            let optionImageIds = [];

            // For MCQ/MSQ, iterate through options and match with chosen ones to find images
            if (questionType === "MCQ" || questionType === "MSQ") {
                chosenOptions.forEach(optionLetter => {
                    $(elem).find('.questionRowTbl tr').each(function() {
                        let optionText = $(this).find('td').eq(1).text().trim(); // Assuming option letter is directly in text
                        if (optionText.startsWith(optionLetter + ".")) { // Match option letter
                            let imageSrc = $(this).find('img').attr('src');
                            if (imageSrc) {
                                let imageId = imageSrc.split('/').pop(); // Extract image ID from src
                                //only keep the 5th last character from the image id excluding the .jpg
                                imageId = imageId.slice(-5, -4);
                                optionImageIds.push(imageId);
                            }
                        }
                    });
                });
                questionsData.push({ questionId, questionType, chosenOptions, optionImageIds });
            } else if (questionType === "NAT") {
                // For NAT questions, extract the given answer from the structure
                let givenAnswer = $(elem).find('.questionRowTbl td').filter(function() {
                    return $(this).text().trim().startsWith("Given Answer :");
                }).next('td').text().trim(); // Assuming the given answer is right next to the "Given Answer :" text
            
                // Push the question ID, type, and the given answer into the questionsData array
                //if given answer is empty then we should push ""
                if(givenAnswer === "--"){
                    givenAnswer = "";
                    questionsData.push({ questionId, questionType, givenAnswer});
                }
                else{
                    questionsData.push({ questionId, questionType, givenAnswer });
                }
            }
        });
        //write the questionsData to a json
        //first empty the file
        fs.writeFile('gate2024.json', '', (err) => {
            if (err) throw err;
            //console.log('The file has been saved!');
        });
        //the json saved should be well formatted with indent 2 so it looks good
        fs.writeFile('gate2024.json', JSON.stringify(questionsData, null, 2), (err) => {
            if (err) throw err;
            //console.log('The file has been saved!');
        });
        // Now you have the extracted question details in `questionsData`
        // You can use this data to calculate the score
        const score = calculateScore(questionsData,examType);
        // Send back the calculated score
        res.json(score);
    } catch (error) {
        // Log the error message
        console.error("Error Message:", error.message);
    
        // Check if the error has a response object
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Error Response Status:", error.response.status);
            console.error("Error Response Headers:", error.response.headers);
            console.error("Error Response Data:", error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.error("Error Request:", error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error', error.message);
        }
        console.error("Error Config:", error.config);
        res.status(500).send('Failed to fetch the response sheet.');
    }
});
