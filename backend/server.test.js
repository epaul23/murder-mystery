import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CASES,
  MAX_QUESTIONS,
  buildInterrogationSystemPrompt,
  calculateEfficiencyScore,
  containsSolutionLeak,
  findCanonViolation,
  getPublicCases,
  getQuestionDirective,
  isSubstantiallyRepeatedReply,
  isValidQuestionCount,
} from './server.js';

const caseOne = CASES[1];

test('question limit accepts 30 questions and rejects higher counts', () => {
  assert.equal(MAX_QUESTIONS, 30);
  assert.equal(isValidQuestionCount(0), true);
  assert.equal(isValidQuestionCount(30), true);
  assert.equal(isValidQuestionCount(31), false);
  assert.equal(calculateEfficiencyScore(0), 100);
  assert.equal(calculateEfficiencyScore(15), 50);
  assert.equal(calculateEfficiencyScore(30), 0);
});

function promptFor(suspectName, question) {
  return buildInterrogationSystemPrompt({
    caseData: caseOne,
    suspectName,
    suspect: caseOne.suspects[suspectName],
    stage: 'early',
    investigativeTurn: 1,
    question,
  });
}

test('recognizes direct accusations despite casual spelling and compound wording', () => {
  assert.match(getQuestionDirective('did u kill him'), /directly accusing you/i);
  assert.match(
    getQuestionDirective('You had arsenic in your bag, so are u responsible for his death?'),
    /directly accusing you/i,
  );
  assert.match(
    getQuestionDirective('His death leaves you in charge of the company. Did you murder your partner?'),
    /directly accusing you/i,
  );
  assert.match(getQuestionDirective('did u do it?'), /directly accusing you/i);
  assert.match(getQuestionDirective('You are responsible for his death.'), /directly accusing you/i);
  assert.match(getQuestionDirective('Did you put arsenic in his tea?'), /directly accusing you/i);
  assert.match(getQuestionDirective('Did you mix something into his tea?'), /directly accusing you/i);
  assert.match(getQuestionDirective('How could you kill him?'), /directly accusing you/i);
  assert.doesNotMatch(getQuestionDirective('What caused his death?'), /directly accusing you/i);
  assert.doesNotMatch(getQuestionDirective('Did you see who killed him?'), /directly accusing you/i);
  assert.doesNotMatch(getQuestionDirective('Do you know who murdered him?'), /directly accusing you/i);
  assert.doesNotMatch(getQuestionDirective('Did you mix the tea yourself?'), /directly accusing you/i);
  assert.doesNotMatch(getQuestionDirective('Did you add milk to the tea?'), /directly accusing you/i);
  assert.doesNotMatch(getQuestionDirective('Did you put the cup on the tray?'), /directly accusing you/i);
  assert.doesNotMatch(getQuestionDirective('Are you responsible for sending Clara away?'), /directly accusing you/i);
  assert.doesNotMatch(getQuestionDirective('Were you responsible for asking for the shawl?'), /directly accusing you/i);
  assert.doesNotMatch(getQuestionDirective('You are responsible for the tea service.'), /directly accusing you/i);
});

test('Hale prompt requires a direct denial and an honest missing-arsenic answer', () => {
  const prompt = promptFor(
    'Dr. Edmund Hale',
    'As his doctor you had access to arsenic. Did u kill him?',
  );
  assert.match(prompt, /Hale knows he did not kill Lord Blackwood/i);
  assert.match(prompt, /lawfully carried it and that a measured vial is now missing/i);
  assert.match(prompt, /deny or respond in the first sentence/i);
  assert.match(prompt, /at most one previously undisclosed major clue/i);
  assert.match(prompt, /PHYSICAL PERFORMANCE/i);
  assert.match(prompt, /Begin most responses/i);
  assert.match(prompt, /square brackets/i);
  assert.match(prompt, /perspiration shows at his brow/i);
});

test('Victoria canon validator rejects invented excuses and tea handling', () => {
  const violations = [
    [
      'No, I did not kill him for money. His will was being contested because of my debts.',
      'Did his death benefit you financially?',
      'victoria_finances',
    ],
    [
      'I was near the study only to retrieve a book I had left there.',
      'Clara says you were outside the study. Is she lying?',
      'victoria_book',
    ],
    [
      'I simply set the cups as usual and trusted the staff to brew the tea.',
      'Did you put anything in your husband\'s tea?',
      'victoria_tea',
    ],
    [
      'I returned for my novel.',
      'Clara says you were outside the study. Is she lying?',
      'victoria_book',
    ],
    [
      'The estate was already legally challenged.',
      'What did Lord Blackwood say about his will?',
      'victoria_finances',
    ],
    [
      'No, his death did not benefit me financially.',
      'Did his death benefit you financially?',
      'victoria_finances',
    ],
    [
      'I never saw his death as a financial advantage.',
      'Did his death benefit you financially?',
      'victoria_finances',
    ],
    [
      'I prepared the tea but added nothing.',
      'Did you handle the tea?',
      'victoria_tea',
    ],
    [
      'The tray was carried in by me.',
      'Who carried the tray?',
      'victoria_tea',
    ],
    [
      'I was responsible for serving the tea.',
      'Who served the tea?',
      'victoria_tea',
    ],
    [
      'I stood to lose the estate.',
      'Did his death benefit you financially?',
      'victoria_finances',
    ],
    [
      'The book was why I went to the corridor.',
      'Clara says you were outside the study. Is she lying?',
      'victoria_book',
    ],
    [
      'I helped Clara prepare the tea.',
      'Who prepared the tea?',
      'victoria_tea',
    ],
  ];
  violations.forEach(([reply, question, expected]) => {
    assert.equal(findCanonViolation(reply, 1, 'Victoria Blackwood', question), expected, reply);
  });

  const canonSafeReplies = [
    [
      '[Victoria turns her wedding ring.] I expected to inherit, yes. That does not mean I wanted him dead.',
      'Did his death benefit you financially?',
    ],
    [
      '[Victoria\'s jaw tightens.] I entered the corridor only to see whether Clara had returned with my shawl.',
      'Clara says you were outside the study. Is she lying?',
    ],
    [
      '[Victoria\'s hands become still.] No. Clara prepared and served the tea; I never touched the cups or tray.',
      'Did you put anything in your husband\'s tea?',
    ],
    [
      'I was outside the study, but I did not return for a book. I was checking whether Clara had brought my shawl.',
      'Clara says you were outside the study. Is she lying?',
    ],
    [
      'We argued after he threatened to change his will.',
      'What did Lord Blackwood say about his will?',
    ],
    [
      'No, I did not kill him for money. I expected to inherit, but I wanted him alive.',
      'Did his death benefit you financially?',
    ],
    [
      'I trusted the household staff to handle the tea.',
      'Did you handle the tea?',
    ],
    [
      'The estate now passes to me.',
      'Did his death benefit you financially?',
    ],
    [
      'I inherit the estate under his unchanged will.',
      'Did his death benefit you financially?',
    ],
  ];
  canonSafeReplies.forEach(([reply, question]) => {
    assert.equal(findCanonViolation(reply, 1, 'Victoria Blackwood', question), null, reply);
  });

  assert.equal(
    findCanonViolation('I prepared and served the tea.', 1, 'Clara Finch', 'Who served the tea?'),
    null,
  );
});

test('each Case 1 suspect has distinct observable body-language direction', () => {
  assert.match(promptFor('Clara Finch', 'Who are you?'), /grips her apron/i);
  assert.match(promptFor('Victoria Blackwood', 'Who are you?'), /turns her wedding ring/i);
  assert.match(promptFor('Dr. Edmund Hale', 'Who are you?'), /removes or cleans his spectacles/i);
  assert.match(promptFor('Reginald Cross', 'Who are you?'), /Reginald leans forward/i);
});

test('Cross prompt carries friendship, apparent profit, and innocence together', () => {
  const prompt = promptFor(
    'Reginald Cross',
    'You profit from Blackwood dying. Did you kill your business partner?',
  );
  assert.match(prompt, /loved Blackwood like a brother/i);
  assert.match(prompt, /could benefit him financially/i);
  assert.match(prompt, /Reginald knows he did not kill Lord Blackwood/i);
});

test('Clara can answer naturally about the Blackwood marriage', () => {
  const prompt = promptFor('Clara Finch', 'Was their marriage happy?');
  assert.match(prompt, /saw his marriage grow cold/i);
  assert.match(prompt, /arguments concerned Victoria's spending/i);
  assert.match(prompt, /does not know the details of the will or the affair/i);
});

test('witness identification is allowed while naming the culprit is blocked', () => {
  assert.equal(
    containsSolutionLeak(
      'It was Victoria. I saw her outside the study.',
      caseOne,
      'Reginald Cross',
      'Who was the woman you saw?',
    ),
    false,
  );
  assert.equal(
    containsSolutionLeak(
      'It was Victoria.',
      caseOne,
      'Reginald Cross',
      'Who killed Lord Blackwood?',
    ),
    true,
  );
});

test('no suspect is allowed to contradict their canon with a confession', () => {
  const blocked = [
    ['I killed Lord Blackwood with the arsenic.', 'Tell me the truth, Doctor.'],
    ['I poisoned the tea.', 'Tell me the truth, Doctor.'],
    ['I mixed arsenic into his tea.', 'Tell me the truth, Doctor.'],
    ['I did kill him.', 'Did you kill him?'],
    ['I was the one who poisoned him.', 'Tell me what happened.'],
    ['I am the killer.', 'Tell me what happened.'],
    ['Yes, I am responsible.', 'Are you responsible for his death?'],
    ['Victoria poisoned Lord Blackwood.', 'What do you believe happened?'],
  ];
  blocked.forEach(([reply, question]) => {
    assert.equal(
      containsSolutionLeak(reply, caseOne, 'Dr. Edmund Hale', question),
      true,
      `Expected to block: ${reply}`,
    );
  });

  const allowed = [
    ['No. I did not kill Lord Blackwood.', 'Did you kill him?'],
    ['I used arsenic in legitimate treatments, but I did not poison Lord Blackwood.', 'Why did you have arsenic?'],
    ['I poisoned no one.', 'Did you poison him?'],
    ['I murdered no one.', 'Did you murder him?'],
    ['I killed time in the drawing room before dinner.', 'What did you do before dinner?'],
    ['I put the arsenic in my medical bag for legitimate treatment.', 'Where did you keep it?'],
    ['Victoria was responsible for sending Clara away.', 'Who requested the shawl?'],
  ];
  allowed.forEach(([reply, question]) => {
    assert.equal(
      containsSolutionLeak(reply, caseOne, 'Dr. Edmund Hale', question),
      false,
      `Expected to allow: ${reply}`,
    );
  });

  assert.equal(
    containsSolutionLeak(
      'Yes, she did.',
      caseOne,
      'Reginald Cross',
      'Did Victoria kill Lord Blackwood?',
    ),
    true,
  );
  assert.equal(
    containsSolutionLeak(
      'Yes, she sent me to fetch the shawl.',
      caseOne,
      'Clara Finch',
      'Was Victoria responsible for sending you away?',
    ),
    false,
  );
  assert.equal(
    containsSolutionLeak(
      'Victoria was responsible for the shawl request, not his death.',
      caseOne,
      'Clara Finch',
      'Who was responsible for asking you to leave?',
    ),
    false,
  );
});

test('substantially repeated answers trigger regeneration', () => {
  const conversation = [{
    role: 'assistant',
    content: 'No, Detective. I did not kill him. I was playing cards in the drawing room.',
  }];
  assert.equal(
    isSubstantiallyRepeatedReply(
      'No, Detective. I did not kill him. I was playing cards in the drawing room.',
      conversation,
    ),
    true,
  );
  assert.equal(
    isSubstantiallyRepeatedReply(
      'A measured vial of arsenic has disappeared from my medical bag.',
      conversation,
    ),
    false,
  );
  assert.equal(
    isSubstantiallyRepeatedReply(
      'No. I did not kill him.',
      [{ role: 'assistant', content: 'No. I did not kill him.' }],
    ),
    true,
  );
});

test('public case profiles expose context without private suspect fields', () => {
  const publicCases = getPublicCases();
  const publicCase = publicCases.find(caseData => caseData.id === 1);
  const hale = publicCase.suspects.find(suspect => suspect.name === 'Dr. Edmund Hale');
  const cross = publicCase.suspects.find(suspect => suspect.name === 'Reginald Cross');

  assert.deepEqual(Object.keys(hale), ['name', 'role', 'relationship', 'publicBio']);
  assert.match(hale.publicBio, /legitimate medical access/i);
  assert.doesNotMatch(hale.publicBio, /missing vial|Victoria visited/i);
  assert.match(cross.relationship, /closest friend/i);
  assert.equal(JSON.stringify(publicCase.suspects).includes('murderStance'), false);
  assert.equal(JSON.stringify(publicCase.suspects).includes('secret'), false);

  const allPublicProfiles = JSON.stringify(publicCases.flatMap(caseData => caseData.suspects));
  assert.equal(allPublicProfiles.includes('Recently sidelined'), false);
  assert.equal(allPublicProfiles.includes('termination papers'), false);
  assert.equal(allPublicProfiles.includes('medical bag remained open'), false);
  publicCases.forEach(caseData => {
    caseData.suspects.forEach(suspect => {
      assert.deepEqual(Object.keys(suspect), ['name', 'role', 'relationship', 'publicBio']);
    });
  });
});
