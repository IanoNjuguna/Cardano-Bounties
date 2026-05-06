"use client";

import { useState } from "react";

type FaqListProps = {
  items: string[][];
};

export function FaqList({ items }: FaqListProps) {
  const [openIndex, setOpenIndex] = useState(-1);
  const [visibleCount, setVisibleCount] = useState(5);

  const showMore = () => {
    setVisibleCount((prev) => Math.min(prev + 5, items.length));
  };

  return (
    <div className="faq-list-container">
      <div className="faq-list">
        {items.slice(0, visibleCount).map(([question, answer], index) => {
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
                <i aria-hidden="true">{isOpen ? "×" : "+"}</i>
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
      
      {visibleCount < items.length && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button 
            onClick={showMore}
            className="button button-secondary"
            style={{ minWidth: '160px', cursor: 'pointer' }}
          >
            Show More Questions
          </button>
        </div>
      )}
    </div>
  );
}
