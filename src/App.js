import {useEffect, useRef, useState} from "react";
import decoDown from "./images/blob down.png"
import decoUp from "./images/blob 5.png"
import decoQuizUp from "./images/blob 5 up quiz.png"
import decoQuizDown from "./images/blob 5 down quiz.png"
import Question from "./components/Question"
import {nanoid} from "nanoid"

export default function App() {

    // game settings

    const GAMETIME = 120
    const multipleScore = 2
    const booleanScore = 1

    function multiply(difficulty) {
        switch (difficulty) {
            case "easy":
                return 1
            case "medium":
                return 1.5
            case "hard":
                return 3
        }
    }


    const [rawTime, setRawTime] = useState(GAMETIME)
    const [toggleRequest, setToggleRequest] = useState(false)
    const [isCheckScreen, setIsCheckScreen] = useState(false)
    const [isInputNameScreen, setIsInputNameScreen] = useState(false)
    const [requestURL, setRequestURL] = useState("")
    const [newQuiz, setNewQuiz] = useState(undefined)
    const [questions, setQuestions] = useState([])

    const [score, setScore] = useState({
        name: "---",
        rawValue: 0,
        value: 0,
        curCorrectAns: 0,
        allCorrectAns: 0,
        allQuestions: 0
    })

    const [isBestScore, setIsBestScore] = useState(false)

    // get previous best score from local storage
    const [prevBestScores, setPrevBestScores] = useState(() => {
        let prevBestScores
        if ((prevBestScores = JSON.parse(
            localStorage.getItem("prevBestScores")
        )))
            return prevBestScores
        else {
            let prevBestScores = []
            for (let i = 0; i < 5; i++) {
                prevBestScores.push({
                    name: "---",
                    value: 0
                })
            }
            localStorage.setItem(
                "prevBestScores",
                JSON.stringify(prevBestScores)
            )
            return prevBestScores
        }
    })

    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState(0)
    const [selectedDifficulty, setSelectedDifficulty] = useState("any")
    const [update, setUpdate] = useState(false)
    const isMounted = useRef(false)

    // request question categories
    useEffect(() => {
        fetch("https://opentdb.com/api_category.php")
            .then((res) => res.json())
            .then((json) => {
                setCategories(json.trivia_categories)
            })
    }, [])

    useEffect(() => {

        // request questions for a round
        if (requestURL !== "") {
            fetch(requestURL)
                .then((res) => res.json())
                .then((json) => (
                    setQuestions(() => {
                        let newQuestions = json.results

                        // assign clicked property to question's answers
                        newQuestions = newQuestions.map(question => {
                            let newIncorrectAnswers =
                                question.incorrect_answers.map(oldIncorrectAnswer => ({
                                        value: oldIncorrectAnswer,
                                        clicked: false,
                                        correct: false
                                    })
                                )
                            return {
                                ...question,
                                correct_answer: {
                                    value: question.correct_answer,
                                    clicked: false,
                                    correct: true
                                },
                                incorrect_answers: newIncorrectAnswers
                            }
                        })

                        // make answers array
                        newQuestions = newQuestions.map(question => {
                            let allAnswers = []
                            allAnswers.push(question.correct_answer)
                            allAnswers.push(...question.incorrect_answers)

                            //mix answers
                            let mixedAnswers =
                                allAnswers.sort(() => Math.random() - 0.5)
                            return {
                                ...question,
                                ansArray: mixedAnswers
                            }
                        })
                        return newQuestions
                    })
                ))
        }
    }, [toggleRequest])

    function startQuiz() {
        setNewQuiz(true)
        setRequestURL(() => {
            let url = "https://opentdb.com/api.php?amount=5"
            url += selectedCategory === 0 ? `` :
                `&category=${selectedCategory}`
            url += selectedDifficulty === "any" ? `` :
                `&difficulty=${selectedDifficulty}`
            return url
        })
        setToggleRequest(prevState => !prevState)
    }


    function handleCategoryChange(event) {
        setSelectedCategory(event.target.value);
    }

    function handleDifficultyChange(event) {
        setSelectedDifficulty(event.target.value)
    }

    function answerClickHandler(questPosition, ansPosition) {
        /* happy birthday <3 */
        setQuestions(prevState => {
            return prevState.map((question, i) => {
                return i === questPosition ?
                    (() => {
                        // console.log(
                            return {
                                ...question,
                                ansArray: (() => {
                                    return question.ansArray.map((answer, j) => {
                                    // console.log(question.ansArray)
                                        return j === ansPosition ?
                                            {
                                                ...answer,
                                                clicked: true
                                            }
                                        :
                                            {
                                                ...answer,
                                                clicked: false
                                            }
                                    })
                                })()
                            }})()
                :
                    {...question}
            })
        })
    }

    function checkAnswers() {
        setIsCheckScreen(true)

        // calculate && set score
        setScore(prevState => {
            let rawScore = 0
            let correctAns = 0
            questions.map(question => {
                question.ansArray.map(answer => {
                    if (answer.clicked && answer.correct) {
                        correctAns++
                        if (question.type === "multiple")
                            rawScore += multipleScore * multiply(question.difficulty)
                        else if (question.type === "boolean")
                            rawScore += booleanScore * multiply(question.difficulty)
                    }
                })
            })

            //multiply score by percentage of correct answers
            let score = multScoreByPercentage(
                prevState.curCorrectAns + correctAns,
                prevState.allQuestions + 5,
                prevState.rawValue + Math.round(rawScore)
            )
            return ({
                name: prevState.name,
                rawValue: prevState.rawValue + Math.round(rawScore),
                value: prevState.value + Math.round(score),
                curCorrectAns: correctAns,
                allCorrectAns: prevState.curCorrectAns + correctAns,
                allQuestions: prevState.allQuestions + 5
            })
        })
    }

    function startNextRound() {
        setToggleRequest(prevState => !prevState)
        setIsCheckScreen(false)
        setScore(prevState => ({
            ...prevState,
            curCorrectAns: 0
        }))
    }

    //timer
    useEffect(() => {
        let intervalId = 0

        if (newQuiz === true)
            intervalId = setInterval(() => {
                setRawTime(prevState => prevState - 1)
            }, 1000)
        else if (newQuiz === false)
            clearInterval(intervalId)
        return (() => clearInterval(intervalId))
    }, [newQuiz])

    function displayTime(rawTime) {
        let minutes = Math.floor(rawTime / 60)
        if (minutes < 10)
            minutes = "0" + minutes.toString()

        let seconds = (rawTime % 60)
        if (seconds < 10)
            seconds = "0" + seconds.toString()
        return `${minutes}:${seconds}`
    }

    function decodeHtml(html) {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    // check time && handle end of the game
    useEffect(() => {
        if (rawTime === 0) {
            setNewQuiz(false)

            // set is best score
            if (score.value > prevBestScores[4].value) {
                setIsBestScore(true)
                setIsInputNameScreen(true)
            }
        }
    }, [rawTime])

    function handleNameChange(event) {
        setScore(prevState => ({
            ...prevState,
            name: event.target.value
        }))
    }

    function multScoreByPercentage(allCorrectAns, allQuestions, rawValue) {
        let percentage

        if (allCorrectAns)
            percentage = (allCorrectAns * 100) / allQuestions
        else
            return 0
        return rawValue * percentage
    }

    function finishInputName() {
        setIsInputNameScreen(false);

        // add current score to the table
        setPrevBestScores(prevState => {
            prevState.push(score)
            prevState.sort((a, b) => (
                a.value > b.value ? -1 : 1
            ))
            prevState = prevState.slice(0, 5)

            //save new table to the local storage
            localStorage.setItem(
                "prevBestScores",
                JSON.stringify(prevState)
            )

            return prevState
        })
        setUpdate(prevState => !prevState)
    }

    function findScoreInPrevBestScore() {
        return prevBestScores.findIndex((a) => (
            a.name === score.name &&
            a.value === score.value
        ))
    }

    function formWinnerCaption() {
        let place = findScoreInPrevBestScore() + 1
        return place <= 3 ? `${place} place!` : `Top 5 score!`
    }

    function startAgain() {
        setRawTime(GAMETIME)

        setToggleRequest(false)
        setIsCheckScreen(false)
        setIsInputNameScreen(false)
        setRequestURL("")
        setNewQuiz(undefined)
        setQuestions([])

        setScore({
            name: "---",
            rawValue: 0,
            value: 0,
            curCorrectAns: 0,
            allCorrectAns: 0,
            allQuestions: 0
        })

        setIsBestScore(false)
        setSelectedCategory(0)
        setSelectedDifficulty("any")
    }

    const categoriesElems = categories.map(category => (
        <option
            key={category.id}
            value={category.id}
        >
            {category.name.replace(/Entertainment: /, "")}
        </option>
    ))

    const questionElems = questions.map((question, index) => (
        <Question
            key={index}
            questPosition={index}
            {...question}
            question={decodeHtml(question.question)}
            answerClickHandler={answerClickHandler}
            decodeHtml={decodeHtml}
            isCheckScreen={isCheckScreen}
        />
    ))

    const prevBestScoresElems = prevBestScores.map((prevBS, i) => (
        <p
            className={
                i === findScoreInPrevBestScore() ?
                    "prev--best--score cur--best--score" :
                    "prev--best--score"
            }
            key={i}
        >
            {i + 1}. {prevBS.name} : {prevBS.value}
        </p>
    ))

    return (

        // start screen
        <div className="app">
            {newQuiz === undefined &&
                <div className="start--page">
                    <div className="start--elems">
                        <h1 className="title">Quizzical</h1>
                        <p className="description">
                            Answer the most questions on the
                            selected topic in 90 seconds!
                        </p>
                        <button
                            className="start--button"
                            onClick={startQuiz}
                        >
                            Start quiz
                        </button>
                    </div>
                    <div className="user--choice">
                        <select
                            className="categories"
                            onChange={handleCategoryChange}
                        >
                            <option value="0">
                                Any category
                            </option>
                            {categoriesElems}
                        </select>
                        <select
                            className="difficulty"
                            onChange={handleDifficultyChange}
                        >
                            <option value="any">
                                Any difficulty
                            </option>
                            <option value="easy">
                                Easy
                            </option>
                            <option value="medium">
                                Medium
                            </option>
                            <option value="hard">
                                Hard
                            </option>
                        </select>
                    </div>
                    <img className="deco--up deco" src={decoUp} />
                    <img className="deco--down deco" src={decoDown} />
                </div>
            }

            {/*quiz screen*/}
            {newQuiz === true &&
                <main className="quiz--screen">
                    <div className="panel">
                        <span
                            className={rawTime > 10 ?
                                "timer" :
                                "timer timer--red"
                            }
                        >
                            {displayTime(rawTime)}
                        </span>
                        <span className="score">
                            Score: {score.value}
                        </span>
                    </div>
                    {questionElems &&
                        <div className="questions">
                            {questionElems}
                        </div>
                    }
                    {!isCheckScreen ?
                        <button
                            className="check--button"
                            onClick={checkAnswers}
                        >
                            Check answers
                        </button>
                    :
                        <div className="check--screen--cont">
                            <p className="check--screen--caption">
                                You scored {score.curCorrectAns}/5 correct answers
                            </p>
                            <button
                                className="next--round--button check--button"
                                onClick={startNextRound}
                            >
                                Next round
                            </button>
                        </div>
                    }
                    <img className="deco--up deco" src={decoQuizUp}/>
                    <img className="deco--down deco" src={decoQuizDown}/>
                </main>
            }

            {/*input name screen*/}
            {isInputNameScreen ?
                <div className="name--screen">
                    <p className="check--screen--caption">
                        Enter your name:
                    </p>
                    <input
                        className="name--input"
                        type="text"
                        max="10"
                        onChange={handleNameChange}
                    />
                    <button
                        className="name--button check--button"
                        onClick={finishInputName}
                    >
                        Confirm
                    </button>
                </div>
                :

                // score screen
                newQuiz === false &&
                <div className="score--page">

                    <div className="score--text">
                        {isBestScore &&
                            <p className="winner--caption">
                                {formWinnerCaption()}
                            </p>
                        }
                        <p className="score--caption">
                            Your score:
                        </p>
                        <p className="score--number">
                            {score.value}
                        </p>
                    </div>
                    <div className="score--table">
                        {prevBestScoresElems}
                    </div>
                    <button
                        className="play--again--button check--button"
                        onClick={startAgain}
                    >
                        Play again!
                    </button>

                    <img className="deco--up deco" src={decoUp}/>
                    <img className="deco--down deco" src={decoDown}/>
                </div>
            }
        </div>
    )
}