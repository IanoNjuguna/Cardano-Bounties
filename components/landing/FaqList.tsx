"use client";

import { useState } from "react";

type FaqListProps = {
  items: string[][];
};

export function FaqList({ items }: FaqListProps) {
  const [openIndex, setOpenIndex] = useState(3);

  return (
    <div className="faq-list">
      {items.map(([question, answer], index) => {
        const isOpen = openIndex === index;

        return (
          <div className={`faq-item ${isOpen ? "is-open" : ""}`} key={question}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
              id={`faq-question-${index}`}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <span>{question}</span>
              <i aria-hidden="true">{isOpen ? "x" : "+"}</i>
            </button>
            <div
              className="faq-answer"
              id={`faq-answer-${index}`}
              role="region"
              aria-labelledby={`faq-question-${index}`}
            >
              <p>{answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
