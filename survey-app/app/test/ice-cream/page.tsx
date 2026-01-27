'use client';

import IceCreamSundae from '@/components/adventures/IceCreamSundae';
import { Question, Answer } from '@/lib/types';

// Example survey questions that map to the sundae building experience
const exampleQuestions: Question[] = [
  {
    id: '1',
    type: 'multiple-choice',
    question: 'How do you prefer to receive updates?',
    options: ['Email', 'Phone', 'Text'],
    required: true,
    order: 0,
  },
  {
    id: '2',
    type: 'multiple-choice',
    question: 'How satisfied are you with our service?',
    options: ['Very satisfied', 'Satisfied', 'Neutral'],
    required: true,
    order: 1,
  },
  {
    id: '3',
    type: 'multiple-choice',
    question: 'What could we improve?',
    options: ['Speed', 'Quality', 'Price'],
    required: true,
    order: 2,
  },
  {
    id: '4',
    type: 'multiple-choice',
    question: 'Would you recommend us?',
    options: ['Definitely', 'Probably', 'Maybe', 'Not sure'],
    required: true,
    order: 3,
  },
];

export default function TestIceCreamPage() {
  const handleComplete = (responses: Answer[]) => {
    console.log('Survey completed!', responses);

    // Format the responses for display
    const formattedResponses = responses.map(r => {
      const question = exampleQuestions.find(q => q.id === r.questionId);
      return {
        question: question?.question || r.questionId,
        answer: Array.isArray(r.value) ? r.value.join(', ') : r.value,
      };
    });

    console.table(formattedResponses);
    alert('Survey completed! Check the console for response data.\n\n' +
      formattedResponses.map(r => `${r.question}: ${r.answer}`).join('\n'));
  };

  return (
    <IceCreamSundae
      questions={exampleQuestions}
      onComplete={handleComplete}
    />
  );
}
