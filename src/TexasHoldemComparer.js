import React, { useState, useMemo } from 'react';
import { Button, Card, CardContent, Typography, Box } from '@mui/material';
import { styled } from '@mui/system';

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['h', 'd', 'c', 's'];

const StyledCardButton = styled(Button)(({ theme }) => ({
  width: '2rem',
  height: '2rem',
  padding: 0,
  margin: '0.125rem',
  minWidth: 'unset',
  fontSize: '0.75rem',
}));

const StyledPlayingCard = styled(Box)(({ theme, suit }) => ({
  width: '3rem',
  height: '4rem',
  border: '2px solid black',
  borderRadius: theme.shape.borderRadius,
  margin: '0.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  backgroundColor: 'hd'.includes(suit) ? 'red' : 'black',
  color: 'white',
}));

const PlayingCard = ({ rank, suit, onRemove }) => (
  <StyledPlayingCard onClick={onRemove} suit={suit}>
    {rank}{suit === 'h' ? '♥' : suit === 'd' ? '♦' : suit === 'c' ? '♣' : '♠'}
  </StyledPlayingCard>
);

const getHandRank = (hand, board) => {
  console.log('Hand:', hand);
  console.log('Board:', board);

  const allCards = [...hand, ...board].sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank));
  const ranks = allCards.map(card => RANKS.indexOf(card.rank));
  const suits = allCards.map(card => card.suit);
  
  console.log('All cards:', allCards);
  console.log('Ranks:', ranks);
  console.log('Suits:', suits);

  const getCounts = arr => arr.reduce((acc, val) => ({...acc, [val]: (acc[val] || 0) + 1}), {});
  const rankCounts = getCounts(ranks);
  const suitCounts = getCounts(suits);
  
  console.log('Rank counts:', rankCounts);
  console.log('Suit counts:', suitCounts);

  const getCards = (filter, n = 5) => allCards.filter(filter).slice(0, n);
  
  const flush = Object.entries(suitCounts).find(([, count]) => count >= 5);
  const flushCards = flush ? getCards(card => card.suit === flush[0]) : null;

  const uniqueSortedRanks = [...new Set(ranks)].sort((a, b) => b - a);
  let straightCards = null;
  for (let i = 0; i <= uniqueSortedRanks.length - 5; i++) {
    if (uniqueSortedRanks[i] - uniqueSortedRanks[i + 4] === 4) {
      straightCards = getCards(card => {
        const rank = RANKS.indexOf(card.rank);
        return rank <= uniqueSortedRanks[i] && rank >= uniqueSortedRanks[i + 4];
      }, 5);
      break;
    }
  }
  // Check for Ace-low straight
  if (!straightCards && uniqueSortedRanks[0] === 12 && uniqueSortedRanks.slice(-4).every((r, i) => r === 3 - i)) {
    straightCards = getCards(card => [12, 3, 2, 1, 0].includes(RANKS.indexOf(card.rank)), 5);
  }

  console.log('Flush cards:', flushCards);
  console.log('Straight cards:', straightCards);

  const pairRanks = Object.entries(rankCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || parseInt(b[0]) - parseInt(a[0]));

  console.log('Pair ranks:', pairRanks);

  const getGroup = n => getCards(card => rankCounts[RANKS.indexOf(card.rank)] === n);

  if (flushCards && straightCards && flushCards[0].rank === straightCards[0].rank) 
    return { rank: 8, name: "Straight Flush", value: RANKS.indexOf(straightCards[0].rank), cards: flushCards };
  if (pairRanks.length > 0 && pairRanks[0][1] === 4)
    return { rank: 7, name: "Four of a Kind", value: parseInt(pairRanks[0][0]), cards: [...getGroup(4), ...getCards(card => rankCounts[RANKS.indexOf(card.rank)] !== 4, 1)] };
  if (pairRanks.length > 1 && pairRanks[0][1] === 3 && pairRanks[1][1] >= 2)
    return { rank: 6, name: "Full House", value: parseInt(pairRanks[0][0]), cards: [...getGroup(3), ...getGroup(2).slice(0, 2)] };
  if (flushCards)
    return { rank: 5, name: "Flush", value: RANKS.indexOf(flushCards[0].rank), cards: flushCards };
  if (straightCards)
    return { rank: 4, name: "Straight", value: RANKS.indexOf(straightCards[0].rank), cards: straightCards };
  if (pairRanks.length > 0 && pairRanks[0][1] === 3) {
    const threeKind = getGroup(3);
    const kickers = getCards(card => !threeKind.includes(card), 2);
    return { rank: 3, name: "Three of a Kind", value: parseInt(pairRanks[0][0]), kickers: kickers.map(card => RANKS.indexOf(card.rank)), cards: [...threeKind, ...kickers] };
  }
  if (pairRanks.length > 1 && pairRanks[0][1] === 2 && pairRanks[1][1] === 2) {
    const pairs = getGroup(2);
    const kicker = getCards(card => !pairs.includes(card), 1);
    return { rank: 2, name: "Two Pair", value: parseInt(pairRanks[0][0]), secondValue: parseInt(pairRanks[1][0]), kicker: RANKS.indexOf(kicker[0].rank), cards: [...pairs, ...kicker] };
  }
  if (pairRanks.length > 0 && pairRanks[0][1] === 2) {
    const pair = getGroup(2);
    const kickers = getCards(card => !pair.includes(card), 3);
    return { rank: 1, name: "One Pair", value: parseInt(pairRanks[0][0]), kickers: kickers.map(card => RANKS.indexOf(card.rank)), cards: [...pair, ...kickers] };
  }
  const highCards = getCards(() => true);
  return { rank: 0, name: "High Card", value: ranks[0], kickers: highCards.slice(1).map(card => RANKS.indexOf(card.rank)), cards: highCards };
};

const TexasHoldemComparer = () => {
  const [hands, setHands] = useState([[], []]);
  const [board, setBoard] = useState([]);
  const [result, setResult] = useState('');
  const [currentSelection, setCurrentSelection] = useState(0);
  const [selectedRank, setSelectedRank] = useState(null);

  const allCards = useMemo(() => [...hands[0], ...hands[1], ...board], [hands, board]);
  const isCardUsed = (rank, suit) => allCards.some(card => card.rank === rank && card.suit === suit);

  const handleCardClick = (section, rank, suit) => {
    if (isCardUsed(rank, suit)) {
      setResult('This card is already in use.');
      return;
    }
    const card = { rank, suit };
    if (section < 2 && hands[section].length < 2) {
      setHands(prev => prev.map((hand, i) => i === section ? [...hand, card] : hand));
    } else if (section === 2 && board.length < 5) {
      setBoard(prev => [...prev, card]);
    }
    setSelectedRank(null);
    setResult('');
  };

  const removeCard = (section, index) => {
    if (section < 2) {
      setHands(prev => prev.map((hand, i) => i === section ? hand.filter((_, j) => j !== index) : hand));
    } else {
      setBoard(prev => prev.filter((_, i) => i !== index));
    }
    setResult('');
  };

  const handleCompare = () => {
    if (hands[0].length !== 2 || hands[1].length !== 2 || board.length !== 5) {
      setResult('Please select 2 cards for each hand and 5 cards for the board.');
      return;
    }
  
    try {
      const ranks = hands.map(hand => getHandRank(hand, board));
      console.log('Hand ranks:', ranks);
  
      if (ranks[0].rank > ranks[1].rank) {
        setResult(`Hand 1 wins with ${ranks[0].name}!`);
      } else if (ranks[1].rank > ranks[0].rank) {
        setResult(`Hand 2 wins with ${ranks[1].name}!`);
      } else if (ranks[0].value > ranks[1].value) {
        setResult(`Hand 1 wins with ${ranks[0].name}!`);
      } else if (ranks[1].value > ranks[0].value) {
        setResult(`Hand 2 wins with ${ranks[1].name}!`);
      } else {
        setResult(`It's a tie! Both hands have ${ranks[0].name}.`);
      }
    } catch (error) {
      console.error('Error in hand comparison:', error);
      setResult('An error occurred while comparing hands. Please check the console for details.');
    }
  };

  const generateRandomBoard = () => {
    if (hands[0].length !== 2 || hands[1].length !== 2) {
      setResult('Please select 2 cards for each hand before generating a random board.');
      return;
    }
    const newBoard = [];
    while (newBoard.length < 5) {
      const randomRank = RANKS[Math.floor(Math.random() * RANKS.length)];
      const randomSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
      if (!isCardUsed(randomRank, randomSuit)) {
        newBoard.push({ rank: randomRank, suit: randomSuit });
      }
    }
    setBoard(newBoard);
    setResult('Random board generated.');
  };

  return (
    <Card sx={{ maxWidth: 800, margin: '0 auto', p: 2 }}>
      <CardContent>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Texas Hold'em Hand Comparer
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {[0, 1].map(i => (
              <Box key={i} sx={{ width: '48%' }}>
                <Typography variant="h6">Hand {i + 1}:</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  {hands[i].map((card, index) => (
                    <PlayingCard key={index} rank={card.rank} suit={card.suit} onRemove={() => removeCard(i, index)} />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
          <Box>
            <Typography variant="h6">Board:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {board.map((card, index) => (
                <PlayingCard key={index} rank={card.rank} suit={card.suit} onRemove={() => removeCard(2, index)} />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography variant="h6" align="center">
              Select cards for: {currentSelection === 2 ? 'Board' : `Hand ${currentSelection + 1}`}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {RANKS.map(rank => (
                <StyledCardButton 
                  key={rank} 
                  onClick={() => setSelectedRank(rank)}
                  disabled={selectedRank !== null || SUITS.every(suit => isCardUsed(rank, suit))}
                >
                  {rank}
                </StyledCardButton>
              ))}
            </Box>
            {selectedRank && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                {SUITS.map(suit => (
                  <StyledCardButton 
                    key={suit} 
                    onClick={() => handleCardClick(currentSelection, selectedRank, suit)}
                    disabled={isCardUsed(selectedRank, suit)}
                    sx={{ bgcolor: 'hd'.includes(suit) ? 'red' : 'black', color: 'white' }}
                  >
                    {suit === 'h' ? '♥' : suit === 'd' ? '♦' : suit === 'c' ? '♣' : '♠'}
                  </StyledCardButton>
                ))}
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 2 }}>
            {[0, 1, 2].map(i => (
              <Button key={i} onClick={() => setCurrentSelection(i)} variant="outlined">
                {i === 2 ? 'Board' : `Hand ${i + 1}`}
              </Button>
            ))}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 2 }}>
            <Button onClick={handleCompare} variant="contained">Compare Hands</Button>
            <Button onClick={generateRandomBoard} variant="contained">Random Board</Button>
            <Button onClick={() => { setHands([[], []]); setBoard([]); setResult(''); setSelectedRank(null); }} variant="outlined">Reset</Button>
          </Box>
          {result && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography align="center" fontWeight="bold">{result}</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TexasHoldemComparer;