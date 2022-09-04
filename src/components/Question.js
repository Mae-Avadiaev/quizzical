export default function Question(props) {

    function calcClassName(answer) {
        let className = "answer--button"
        if (props.isCheckScreen && answer.correct)
            className += " correct"
        else if (props.isCheckScreen && answer.clicked && !answer.correct)
            className += " wrong"
        else if (props.isCheckScreen)
            className += " blocked"
        else if (answer.clicked)
            className += " clicked"
        return className
    }

    const answerElems = props.ansArray.map((answer, i) => (
        <button
            key={i}
            className={calcClassName(answer)}
            onClick={() => props.answerClickHandler(
                props.questPosition,
                i
                )
            }
        >
            {props.decodeHtml(answer.value)}
        </button>
    ))



    return (
        <div className="question">
            <h3 className="main--question">
                {props.question}
            </h3>
            <div className="answers">
                {answerElems}
            </div>
            <hr />
        </div>
    )
}