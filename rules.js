(function (root) {
    const districts = [
        { id: 'budget-hub', name: 'Budget Hub', unlock: 0, topic: 'Budget Quiz', questions: [
            ['You have $100. Rent is $60 and food is $30. What is left?', ['$10', '$40', '$70'], 0, 'Subtract your essentials first: 100 − 60 − 30 = 10.'],
            ['Which habit makes saving easier?', ['Save what is left by chance', 'Set aside money when paid', 'Ignore your balance'], 1, 'A planned amount is easier to keep track of.'],
            ['What is an emergency fund for?', ['Unexpected essential costs', 'Every sale you find', 'Buying lottery tickets'], 0, 'Keep a cushion for things like urgent repairs.']
        ] },
        { id: 'market', name: 'Legacy Market', unlock: 50, topic: 'Spot the Scam', questions: [
            ['A seller demands gift cards before shipping. What do you do?', ['Pay quickly', 'Stop and verify the seller', 'Send your bank login'], 1, 'Gift-card payments are hard to recover. Verify unfamiliar sellers.'],
            ['An email asks for your bank password. Your next move?', ['Reply with it', 'Click the link', 'Open the bank’s official app yourself'], 2, 'Use a trusted route rather than a link in an unexpected message.'],
            ['A deal guarantees huge returns with no risk. What is the warning sign?', ['Guaranteed returns', 'A clear receipt', 'A refund policy'], 0, 'High guaranteed returns are a reason to be skeptical.']
        ] },
        { id: 'savings-cafe', name: 'Savings Cafe', unlock: 150, topic: 'Savings Sprint', sprint: true },
        { id: 'bank', name: 'Bank & Beyond', unlock: 300, topic: 'Credit Builder', questions: [
            ['What helps build a payment history?', ['Paying bills on time', 'Missing due dates', 'Ignoring statements'], 0, 'Consistent on-time payments matter.'],
            ['Your card has a $500 limit. Which balance leaves more breathing room?', ['$490', '$100', '$500'], 1, 'Using less of your available credit leaves more room for essentials.'],
            ['What should you check before borrowing?', ['Only the logo', 'Interest, fees, and repayment terms', 'The ad’s colors'], 1, 'Understand the full cost and whether repayments fit your budget.']
        ] },
        { id: 'freedom-park', name: 'Freedom Park', unlock: 500, topic: 'Park Challenge', sprint: true },
        { id: 'code-lab', name: 'Code Lab', unlock: 750, topic: 'Code Challenge', questions: [
            ['balance = 100; balance -= 30; What is balance?', ['130', '70', '30'], 1, 'The subtraction assignment takes 30 from 100.'],
            ['Which check stops a purchase going over budget?', ['cost <= balance', 'cost > balance', 'cost === 0'], 0, 'Only spend when the available balance covers the cost.'],
            ['Why validate a money input?', ['To accept any text', 'To reject invalid or negative amounts', 'To hide the balance'], 1, 'Check input before changing stored amounts.']
        ] },
        { id: 'tech-center', name: 'Tech Center', unlock: 1000, topic: 'Digital Safety', questions: [
            ['What does encryption do?', ['Protects data by encoding it', 'Guarantees profit', 'Deletes your account'], 0, 'Encryption helps keep data unreadable without the right key.'],
            ['Which is a safer account setup?', ['Reuse one password', 'Share your login', 'Unique password and two-step verification'], 2, 'A second verification step helps protect a stolen password.'],
            ['An app asks for permissions it does not need. What now?', ['Allow everything', 'Review and decline unnecessary access', 'Share more data'], 1, 'Give apps only the access they need.']
        ] },
        { id: 'investment-hub', name: 'Investment Hub', unlock: 1500, topic: 'Risk & Reward', questions: [
            ['What does diversification mean?', ['Put everything in one company', 'Spread investments across different assets', 'Never check fees'], 1, 'Spreading exposure reduces dependence on one investment.'],
            ['Can an investment lose value?', ['Yes', 'Never', 'Only on Mondays'], 0, 'Investing involves risk, including loss.'],
            ['What should you compare before choosing a fund?', ['Only last week’s return', 'Fees, risks, and your time horizon', 'Just the name'], 1, 'Costs and risk matter alongside your goals.']
        ] },
        { id: 'venture-vault', name: 'Venture Vault', unlock: 2000, topic: 'Business Basics', questions: [
            ['Revenue is $200 and costs are $140. What is profit?', ['$340', '$60', '$140'], 1, 'Profit is revenue minus costs.'],
            ['Before launching an idea, what helps most?', ['Ask potential customers about their needs', 'Buy every tool', 'Skip the research'], 0, 'Learn what people need before spending heavily.'],
            ['What is cash flow?', ['A logo design', 'Money moving in and out', 'Your follower count'], 1, 'A business needs cash available when bills are due.']
        ] },
        { id: 'fin-tech-tower', name: 'FinTech Tower', unlock: 3000, topic: 'Tower Finale', sprint: true }
    ];
    const fresh = () => ({ money: 0, rep: 0, lives: 3, completed: [] });
    function restore(raw) {
        if (!raw || raw.version !== 1) return fresh();
        const valid = (n, max) => Number.isSafeInteger(n) && n >= 0 && n <= max;
        return {
            money: valid(raw.money, 100000000) ? raw.money : 0,
            rep: valid(raw.rep, 100000000) ? raw.rep : 0,
            lives: valid(raw.lives, 3) && raw.lives > 0 ? raw.lives : 3,
            completed: Array.isArray(raw.completed) ? [...new Set(raw.completed.filter(id => districts.some(d => d.id === id)))] : []
        };
    }
    function available(district, progress) {
        const index = districts.indexOf(district);
        return progress.completed.includes(district.id) || (progress.money >= district.unlock && (index === 0 || progress.completed.includes(districts[index - 1].id)));
    }
    function reward(level, points) { return Math.max(0, Math.min(500, Math.floor(points))) + level * 10; }
    const api = { districts, fresh, restore, available, reward };
    if (typeof module !== 'undefined') module.exports = api;
    else root.HustleRules = api;
})(globalThis);
