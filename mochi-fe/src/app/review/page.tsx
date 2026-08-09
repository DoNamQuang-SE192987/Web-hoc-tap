'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Volume2, Check, X, ShieldAlert, Sparkles, Smile } from 'lucide-react';

interface CardProgressType {
  cardId: string;
  front: string;
  back: string;
  exampleSentence?: string;
  pronunciation?: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CardProgressType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // States for writing/typing check
  const [typedWord, setTypedWord] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Load due cards
  useEffect(() => {
    fetchDueCards();
  }, []);

  const fetchDueCards = async () => {
    try {
      const res: any = await api.get('/api/decks/due');
      if (res.success) {
        setCards(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const checkWord = () => {
    const currentCard = cards[currentIndex];
    const cleanTyped = typedWord.trim().toLowerCase();
    const cleanActual = currentCard.front.trim().toLowerCase();
    
    setIsCorrect(cleanTyped === cleanActual);
    setIsChecked(true);
  };

  const handleReviewSubmit = async (quality: number) => {
    const currentCard = cards[currentIndex];
    try {
      // Gọi API cập nhật tiến trình ôn tập (SM-2)
      await api.post('/api/review', {
        cardId: currentCard.cardId,
        quality: quality,
      });

      // Chuyển sang card tiếp theo
      if (currentIndex < cards.length - 1) {
        setTypedWord('');
        setIsChecked(false);
        setIsFlipped(false);
        setCurrentIndex(currentIndex + 1);
      } else {
        // Hoàn thành phiên ôn tập -> Lưu lại thời điểm kết thúc
        localStorage.setItem('last_session_time', Date.now().toString());
        setCurrentIndex(currentIndex + 1); // Trạng thái hoàn thành
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Đang chuẩn bị thẻ học...
      </div>
    );
  }

  // Kết thúc phiên ôn tập
  if (cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />

        <div className="max-w-md w-full bg-card border border-border p-8 rounded-3xl text-center space-y-6 shadow-lg relative z-10">
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="h-10 w-10 animate-bounce text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Hoàn thành xuất sắc!
          </h2>
          <p className="text-muted-foreground text-sm">
            Bạn đã hoàn thành phiên ôn tập. Hệ thống Spaced Repetition (SM-2) sẽ tính toán và hẹn giờ cho bạn quay lại ôn tập vào **Thời điểm vàng 30 phút sau**.
          </p>

          <Button 
            onClick={() => router.push('/')}
            className="w-full bg-primary hover:bg-primary/95 text-white py-6 rounded-2xl font-bold shadow-md"
          >
            Quay về Trang chủ
          </Button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = ((currentIndex) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden pb-10">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl" />

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-card/85 relative z-10">
        <Button 
          onClick={() => router.push('/')}
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-bold text-sm text-muted-foreground">
          Tiến trình: Thẻ {currentIndex + 1} / {cards.length}
        </span>
        <div className="w-10 h-1" />
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-muted relative z-10">
        <Progress value={progressPercent} className="h-full bg-primary rounded-none transition-all duration-300" />
      </div>

      {/* Main Review Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-6 mt-10 flex flex-col justify-center relative z-10">
        {/* Flashcard Container (3D Flip Effect) */}
        <div 
          onClick={handleFlip}
          className={`w-full aspect-[1.6] cursor-pointer perspective-1000 select-none`}
        >
          <div 
            className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* Front Side */}
            <Card className="absolute inset-0 backface-hidden border-border bg-card flex flex-col items-center justify-center p-8 text-center shadow-md">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <h1 className="text-4xl font-extrabold text-foreground tracking-wide">{currentCard.front}</h1>
                {currentCard.pronunciation && (
                  <div className="flex items-center space-x-1.5 text-primary font-mono text-sm bg-primary/5 px-3 py-1 rounded-full border border-primary/20">
                    <Volume2 className="h-4 w-4" />
                    <span>{currentCard.pronunciation}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground pt-6 animate-pulse">Bấm vào thẻ để xem định nghĩa</p>
              </CardContent>
            </Card>

            {/* Back Side */}
            <Card className="absolute inset-0 backface-hidden rotate-y-180 border-border bg-card flex flex-col items-center justify-center p-8 text-center shadow-md">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <span className="text-xs text-primary font-bold uppercase tracking-wider">Ý nghĩa</span>
                <h2 className="text-3xl font-bold text-foreground">{currentCard.back}</h2>
                {currentCard.exampleSentence && (
                  <p className="text-sm text-muted-foreground italic max-w-sm border-t border-border pt-4 mt-2">
                    "{currentCard.exampleSentence}"
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Typing Practice Panel & Review Buttons */}
        {isFlipped && (
          <div className="mt-8 space-y-6 animate-fade-in">
            {/* Typing practice form */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <h4 className="font-bold text-xs text-primary flex items-center">
                <Smile className="h-4 w-4 mr-1.5" /> Ghi nhớ từ vựng (Nhập lại từ tiếng Anh bạn vừa lật)
              </h4>
              <div className="flex space-x-3">
                <Input
                  type="text"
                  placeholder="Gõ lại từ tiếng Anh ở mặt trước..."
                  value={typedWord}
                  onChange={(e) => setTypedWord(e.target.value)}
                  disabled={isChecked}
                  className={`bg-background text-foreground placeholder:text-gray-400 focus-visible:ring-primary border ${
                    isChecked
                      ? isCorrect
                        ? 'border-emerald-500/50 focus-visible:ring-emerald-500 bg-emerald-50/10'
                        : 'border-red-500/50 focus-visible:ring-red-500 bg-red-50/10'
                      : 'border-border'
                  }`}
                />
                {!isChecked ? (
                  <Button onClick={checkWord} className="bg-primary hover:bg-primary/95 text-white px-6">
                    Kiểm tra
                  </Button>
                ) : (
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${isCorrect ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </div>
                )}
              </div>

              {isChecked && !isCorrect && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                  Đáp án chính xác: <strong className="font-mono text-sm underline">{currentCard.front}</strong>
                </p>
              )}
            </div>

            {/* Quality rating buttons (SM-2) */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-muted-foreground text-center uppercase tracking-wider">Đánh giá độ nhớ để tính lịch ôn</h5>
              <div className="grid grid-cols-4 gap-3">
                <Button 
                  onClick={() => handleReviewSubmit(1)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-6 rounded-xl font-bold flex flex-col h-auto"
                >
                  <span>Quên</span>
                  <span className="text-[10px] font-normal text-red-600/70 mt-1">Lại sau 30p</span>
                </Button>
                <Button 
                  onClick={() => handleReviewSubmit(2)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 py-6 rounded-xl font-bold flex flex-col h-auto"
                >
                  <span>Khó</span>
                  <span className="text-[10px] font-normal text-amber-600/70 mt-1">Lại ngày mai</span>
                </Button>
                <Button 
                  onClick={() => handleReviewSubmit(3)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 py-6 rounded-xl font-bold flex flex-col h-auto"
                >
                  <span>Nhớ</span>
                  <span className="text-[10px] font-normal text-indigo-600/70 mt-1">Lại sau vài ngày</span>
                </Button>
                <Button 
                  onClick={() => handleReviewSubmit(4)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 py-6 rounded-xl font-bold flex flex-col h-auto"
                >
                  <span>Dễ</span>
                  <span className="text-[10px] font-normal text-emerald-600/70 mt-1">Lại dài hạn</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
