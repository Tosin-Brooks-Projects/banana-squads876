/**
 * Seed test survey data for allioluwatosin8@gmail.com
 * Usage: node scripts/seed-test-data.mjs
 *
 * Reads FIREBASE_SERVICE_ACCOUNT_KEY from .env.local (supports multiline JSON).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ───────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(__dirname, '../.env.local');
  const raw = readFileSync(envPath, 'utf8');
  const env = {};
  let currentKey = null;
  let currentValue = [];

  for (const line of raw.split('\n')) {
    if (line.startsWith('#') || line.trim() === '') {
      if (currentKey) { env[currentKey] = currentValue.join('\n'); currentKey = null; currentValue = []; }
      continue;
    }
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0 && !currentKey) {
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1);
      // Peek if value continues on next lines (no = sign and starts with space or brace)
      currentKey = key;
      currentValue = [val];
    } else if (currentKey) {
      if (line.includes('=') && !line.startsWith(' ') && !line.startsWith('{') && !line.startsWith('"')) {
        env[currentKey] = currentValue.join('\n');
        currentKey = null;
        currentValue = [];
        // Re-process this line
        const eqIdx2 = line.indexOf('=');
        currentKey = line.slice(0, eqIdx2).trim();
        currentValue = [line.slice(eqIdx2 + 1)];
      } else {
        currentValue.push(line);
      }
    }
  }
  if (currentKey) env[currentKey] = currentValue.join('\n');
  return env;
}

const env = loadEnv();
const serviceAccountRaw = env['FIREBASE_SERVICE_ACCOUNT_KEY'];
if (!serviceAccountRaw || serviceAccountRaw.trim() === '') {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountRaw);
} catch (e) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
  process.exit(1);
}

// ── Init Admin SDK ────────────────────────────────────────────────────────────

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();

// ── Find user ─────────────────────────────────────────────────────────────────

async function getUserId() {
  const email = 'allioluwatosin8@gmail.com';
  try {
    const user = await auth.getUserByEmail(email);
    console.log(`✅ Found user: ${email} (uid: ${user.uid})`);
    return user.uid;
  } catch (e) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }
}

// ── Survey definitions ────────────────────────────────────────────────────────

function makeSurveys(userId) {
  const now = admin.firestore.Timestamp.now();
  const base = {
    userId,
    status: 'published',
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    pricingTier: 'free',
    responseLimit: 25,
    paymentStatus: 'free',
    responseCount: 0,
    settings: {
      allowAnonymous: true,
      showProgressBar: true,
      randomizeQuestions: false,
    },
  };

  return [
    {
      ...base,
      title: 'Ice Cream Preferences',
      slug: 'ice-cream-preferences',
      description: 'Tell us your favorite ice cream combinations!',
      adventureType: 'ice-cream-sundae',
      questions: [
        { id: 'q1', type: 'multiple-choice', question: "What's your favorite base?", required: true, order: 0, options: ['Vanilla', 'Chocolate', 'Strawberry', 'Mint Chip'], allowMultiple: false },
        { id: 'q2', type: 'multiple-choice', question: 'Pick your toppings!', required: true, order: 1, options: ['Sprinkles', 'Hot Fudge', 'Whipped Cream', 'Cherry', 'Nuts'], allowMultiple: true },
        { id: 'q3', type: 'rating', question: 'How often do you eat ice cream?', required: false, order: 2, scale: 5, startLabel: 'Rarely', endLabel: 'Every day' },
        { id: 'q4', type: 'text', question: 'Any secret ice cream combos you love?', required: false, order: 3, placeholder: 'Share your guilty pleasure...' },
      ],
    },
    {
      ...base,
      title: 'Pizza Night Survey',
      slug: 'pizza-night-survey',
      description: 'Help us find the perfect pizza for everyone.',
      adventureType: 'pizza-builder',
      questions: [
        { id: 'q1', type: 'multiple-choice', question: 'Preferred crust style?', required: true, order: 0, options: ['Thin & Crispy', 'Classic Hand-tossed', 'Deep Dish', 'Stuffed Crust'], allowMultiple: false },
        { id: 'q2', type: 'multiple-choice', question: 'Favorite sauce?', required: true, order: 1, options: ['Classic Tomato', 'BBQ', 'White Garlic', 'Pesto'], allowMultiple: false },
        { id: 'q3', type: 'multiple-choice', question: 'Must-have toppings?', required: true, order: 2, options: ['Pepperoni', 'Mushrooms', 'Bell Peppers', 'Olives', 'Jalapeños', 'Pineapple'], allowMultiple: true },
        { id: 'q4', type: 'emoji-slider', question: 'How spicy do you like it?', required: false, order: 3, emojis: ['😌', '🙂', '😮', '🥵', '🔥'], labels: { start: 'Mild', end: 'Inferno' } },
      ],
    },
    {
      ...base,
      title: 'Morning Coffee Ritual',
      slug: 'morning-coffee-ritual',
      description: 'How do you take your coffee?',
      adventureType: 'coffee-brewer',
      questions: [
        { id: 'q1', type: 'multiple-choice', question: 'Favorite coffee bean origin?', required: true, order: 0, options: ['Ethiopian', 'Colombian', 'Brazilian', 'Sumatran', 'Guatemalan'], allowMultiple: false },
        { id: 'q2', type: 'multiple-choice', question: 'How do you brew it?', required: true, order: 1, options: ['Espresso', 'Pour-over', 'French Press', 'Cold Brew', 'Drip Coffee'], allowMultiple: false },
        { id: 'q3', type: 'rating', question: 'Rate your morning coffee satisfaction', required: false, order: 2, scale: 10, startLabel: 'Need more', endLabel: 'Perfect' },
        { id: 'q4', type: 'text', question: 'Any special additions to your brew?', required: false, order: 3, placeholder: 'Cinnamon? Oat milk? Tell us!' },
      ],
    },
    {
      ...base,
      title: 'Garden Dreams',
      slug: 'garden-dreams',
      description: 'What would you grow in your dream garden?',
      adventureType: 'garden-grower',
      questions: [
        { id: 'q1', type: 'multiple-choice', question: 'What kind of garden?', required: true, order: 0, options: ['Vegetable Garden', 'Flower Garden', 'Herb Garden', 'Fruit Orchard', 'Mixed Garden'], allowMultiple: false },
        { id: 'q2', type: 'multiple-choice', question: 'Favorite plants to grow?', required: true, order: 1, options: ['Tomatoes', 'Roses', 'Basil', 'Sunflowers', 'Strawberries', 'Lavender'], allowMultiple: true },
        { id: 'q3', type: 'rating', question: 'How green is your thumb?', required: false, order: 2, scale: 5, startLabel: 'Black thumb 😅', endLabel: 'Master gardener' },
        { id: 'q4', type: 'text', question: 'Describe your dream outdoor space', required: false, order: 3 },
      ],
    },
    {
      ...base,
      title: 'Dream Home Wishlist',
      slug: 'dream-home-wishlist',
      description: 'Design your perfect home with us.',
      adventureType: 'dream-home',
      questions: [
        { id: 'q1', type: 'multiple-choice', question: 'What architectural style?', required: true, order: 0, options: ['Modern Minimalist', 'Cozy Cottage', 'Industrial Loft', 'Traditional Colonial', 'Mediterranean Villa'], allowMultiple: false },
        { id: 'q2', type: 'multiple-choice', question: 'Must-have rooms?', required: true, order: 1, options: ['Home Office', 'Home Gym', 'Theater Room', 'Library', "Chef's Kitchen", 'Sunroom'], allowMultiple: true },
        { id: 'q3', type: 'multiple-choice', question: 'Outdoor space preference?', required: false, order: 2, options: ['Large Backyard', 'Rooftop Terrace', 'Wraparound Porch', 'Private Pool', 'Small Balcony'], allowMultiple: false },
        { id: 'q4', type: 'text', question: 'One non-negotiable feature of your dream home?', required: false, order: 3, placeholder: 'Floor-to-ceiling windows? Walk-in closet?' },
      ],
    },
    {
      ...base,
      title: 'Team Feedback — Q2',
      slug: 'team-feedback-q2',
      description: 'Quick pulse check on how the team is doing.',
      adventureType: 'classic',
      questions: [
        { id: 'q1', type: 'rating', question: "How satisfied are you with the team's collaboration this quarter?", required: true, order: 0, scale: 10, startLabel: 'Very unsatisfied', endLabel: 'Very satisfied' },
        { id: 'q2', type: 'multiple-choice', question: "What's working well?", required: true, order: 1, options: ['Communication', 'Speed of delivery', 'Code quality', 'Team morale', 'Planning sessions'], allowMultiple: true },
        { id: 'q3', type: 'multiple-choice', question: 'Biggest blocker this quarter?', required: false, order: 2, options: ['Too many meetings', 'Unclear requirements', 'Tech debt', 'Burnout', 'Process overhead'], allowMultiple: false },
        { id: 'q4', type: 'emoji-slider', question: "How's your energy level going into Q3?", required: false, order: 3, emojis: ['😴', '😐', '🙂', '😄', '🚀'], labels: { start: 'Exhausted', end: 'Pumped!' } },
        { id: 'q5', type: 'text', question: 'Any suggestions for next quarter?', required: false, order: 4, placeholder: 'Be honest, this is anonymous...' },
      ],
    },
  ];
}

// ── Sample responses ──────────────────────────────────────────────────────────

function makeResponses(surveyId, questions, count) {
  const names = ['Alex Chen', 'Jordan Smith', 'Taylor Brown', 'Morgan Lee', 'Casey Kim',
                 'Riley Davis', 'Quinn Wilson', 'Avery Martinez', 'Parker Johnson', 'Drew Thompson',
                 'Sam Rivera', 'Blake Turner', 'Reese Cooper', 'Hayden Brooks', 'Rowan Foster'];

  return Array.from({ length: count }, (_, i) => {
    const answers = questions.map(q => {
      if (q.type === 'multiple-choice') {
        if (q.allowMultiple) {
          const picked = q.options.filter(() => Math.random() > 0.5);
          return { questionId: q.id, value: picked.length ? picked : [q.options[0]] };
        }
        return { questionId: q.id, value: q.options[Math.floor(Math.random() * q.options.length)] };
      }
      if (q.type === 'rating') {
        return { questionId: q.id, value: Math.floor(Math.random() * q.scale) + 1 };
      }
      if (q.type === 'emoji-slider') {
        const emojis = q.emojis || ['😌', '🙂', '😮', '🥵', '🔥'];
        return { questionId: q.id, value: emojis[Math.floor(Math.random() * emojis.length)] };
      }
      const texts = ['Love it!', 'Really interesting experience', 'Could be better', 'Great concept!', 'Very unique approach'];
      return { questionId: q.id, value: texts[Math.floor(Math.random() * texts.length)] };
    });

    const daysAgo = Math.floor(Math.random() * 30);
    const completedAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() - daysAgo * 86400000));
    const name = names[i % names.length];

    return {
      surveyId,
      respondentName: name,
      respondentEmail: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      answers,
      completedAt,
      metadata: {
        completionTime: Math.floor(Math.random() * 180) + 30,
        userAgent: 'Mozilla/5.0 (Test Data)',
      },
    };
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const userId = await getUserId();
  const surveys = makeSurveys(userId);
  const responseCounts = [8, 12, 5, 15, 7, 20];

  for (let i = 0; i < surveys.length; i++) {
    const survey = surveys[i];
    console.log(`\n📋 Creating survey: "${survey.title}"...`);

    const surveyRef = await db.collection('surveys').add(survey);
    const surveyId = surveyRef.id;
    console.log(`   ✅ Survey created: ${surveyId}`);

    const count = responseCounts[i];
    const responses = makeResponses(surveyId, survey.questions, count);

    const batch = db.batch();
    for (const response of responses) {
      batch.set(db.collection('responses').doc(), response);
    }
    await batch.commit();
    console.log(`   📊 Added ${count} responses`);

    await surveyRef.update({ responseCount: count });
  }

  console.log('\n🎉 Done! Test data seeded successfully.');
  console.log('\nSurveys created:');
  surveys.forEach((s, i) => console.log(`  ${s.adventureType.padEnd(20)} "${s.title}" — ${responseCounts[i]} responses`));
  process.exit(0);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
