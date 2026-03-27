import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/database/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

type CardData = {
  nameThai: string;
  imagePath: string;
  baseMeaning: string;
};
// 📦 เอาข้อมูลที่เพื่อนในทีมทำมา แปะใส่ตัวแปรนี้ได้เลยครับ
const minorArcanaData = {
  Cups: {
    Ace: {
      nameThai: '1 ถ้วย',
      imagePath: '/tarotcards/CU1.png',
      baseMeaning:
        'เป็นจุดเริ่มต้นของความรู้สึกใหม่ ไม่ว่าจะเป็นความรัก ความสัมพันธ์ หรือความสุขในใจ มีโอกาสเปิดใจรับสิ่งดี ๆ เข้ามา และอาจมีคนใหม่หรือโอกาสใหม่ด้านความรักเกิดขึ้น ช่วงนี้เหมาะกับการเริ่มต้นความสัมพันธ์หรือการเยียวยาหัวใจ',
    },
    Two: {
      nameThai: '2 ถ้วย',
      imagePath: '/tarotcards/CU2.png',
      baseMeaning:
        'เป็นไพ่ของความสัมพันธ์ที่สมดุลและเข้าใจกัน อาจเป็นคู่รัก หุ้นส่วน หรือความสัมพันธ์ที่มีความหมายลึก เป็นช่วงที่มีโอกาสเจอคนที่เข้ากันได้ดีหรือความรักพัฒนาไปอีกขั้น',
    },
    Three: {
      nameThai: '3 ถ้วย',
      imagePath: '/tarotcards/CU3.png',
      baseMeaning:
        'เป็นช่วงของความสุข การเฉลิมฉลอง หรือข่าวดีจากคนรอบตัว อาจมีงานสังสรรค์ มิตรภาพ หรือความสัมพันธ์ที่ดีขึ้น เป็นช่วงที่มีพลังบวกและความสุขร่วมกับผู้อื่น',
    },
    Four: {
      nameThai: '4 ถ้วย',
      imagePath: '/tarotcards/CU4.png',
      baseMeaning:
        'ไพ่มีพลัง “ความสุขและพลังสังคม” จึงสัมพันธ์กับหินที่ช่วยเพิ่มพลังบวก เสน่ห์ และการดึงดูดความสัมพันธ์ที่ดี',
    },
    Five: {
      nameThai: '5 ถ้วย',
      imagePath: '/tarotcards/CU5.png',
      baseMeaning:
        'มีความเสียใจหรือผิดหวังจากสิ่งที่เกิดขึ้น อาจเป็นเรื่องความรักหรือความสัมพันธ์ แต่ยังมีสิ่งดีเหลืออยู่ ไพ่ใบนี้บอกให้ค่อย ๆ ฟื้นตัวและมองไปข้างหน้า',
    },
    Six: {
      nameThai: '6 ถ้วย',
      imagePath: '/tarotcards/CU6.png',
      baseMeaning:
        'เรื่องราวในอดีตกลับมา อาจเป็นคนเก่าหรือความทรงจำที่ยังมีผลต่อใจ เป็นไพ่ของความอบอุ่น ความคุ้นเคย และความสัมพันธ์ที่บริสุทธิ์',
    },
    Seven: {
      nameThai: '7 ถ้วย',
      imagePath: '/tarotcards/CU7.png',
      baseMeaning:
        'มีตัวเลือกมากแต่ยังไม่ชัดเจน อาจเกิดความลังเลหรือสับสน ต้องระวังการตัดสินใจจากภาพลวงหรือความฝันที่ยังไม่เป็นจริง',
    },
    Eight: {
      nameThai: '8 ถ้วย',
      imagePath: '/tarotcards/CU8.png',
      baseMeaning:
        'ถึงเวลาต้องเดินออกจากสิ่งที่ไม่ตอบโจทย์ แม้จะยังมีความผูกพันแต่ไม่เติมเต็มอีกต่อไป เป็นไพ่ของการเลือกตัวเองและการเปลี่ยนเส้นทาง',
    },
    Nine: {
      nameThai: '9 ถ้วย',
      imagePath: '/tarotcards/CU9.png',
      baseMeaning:
        'เป็นไพ่แห่งความสมหวังและความพอใจ สิ่งที่หวังไว้มีแนวโน้มจะสำเร็จ เป็นช่วงที่ชีวิตมีความสุขและรู้สึกเติมเต็ม',
    },
    Ten: {
      nameThai: '10 ถ้วย',
      imagePath: '/tarotcards/CU10.png',
      baseMeaning:
        'ไพ่มีพลัง “ความสมหวังและความพึงพอใจ” จึงสัมพันธ์กับหินที่ช่วยดึงดูดโชคและความสำเร็จ',
    },
    Page: {
      nameThai: 'เด็กถือถ้วย',
      imagePath: '/tarotcards/CU11.png',
      baseMeaning:
        'มีข่าวดีหรือโอกาสใหม่ด้านความรัก อาจมีคนเข้ามาแบบใส ๆ จริงใจ หรือความรู้สึกใหม่เริ่มก่อตัว',
    },
    Knight: {
      nameThai: 'อัศวินถือถ้วย',
      imagePath: '/tarotcards/CU12.png',
      baseMeaning:
        'มีพลังของความโรแมนติกและการเข้าหา อาจมีคนแสดงความรู้สึกหรือความสัมพันธ์พัฒนาอย่างจริงจัง',
    },
    Queen: {
      nameThai: 'ราชินีถือถ้วย',
      imagePath: '/tarotcards/CU13.png',
      baseMeaning:
        'เป็นพลังของความอ่อนโยน เข้าใจอารมณ์ลึก และมีความเมตตา เป็นช่วงที่ความสัมพันธ์มีความลึกซึ้งและเข้าใจกันมากขึ้น',
    },
    King: {
      nameThai: 'ราชาถือถ้วย',
      imagePath: '/tarotcards/CU14.png',
      baseMeaning:
        'เป็นพลังของความรักที่มั่นคงและควบคุมอารมณ์ได้ดี เป็นช่วงที่ความสัมพันธ์จริงจังหรือมีคนที่มีวุฒิภาวะเข้ามา',
    },
  },

  Pentacles: {
    Ace: {
      nameThai: '1 เหรียญ',
      imagePath: '/tarotcards/C1.png',
      baseMeaning:
        'เป็นจุดเริ่มต้นของโอกาสด้านการเงินหรือการงาน มีแนวโน้มได้งานใหม่ รายได้ใหม่ หรือช่องทางสร้างเงินที่มั่นคง ไพ่ใบนี้ถือเป็นสัญญาณที่ดีของโอกาสที่จับต้องได้ หากลงมือทำอย่างจริงจังจะเห็นผลชัดเจนในอนาคต',
    },
    Two: {
      nameThai: '2 เหรียญ',
      imagePath: '/tarotcards/C2.png',
      baseMeaning:
        'เป็นช่วงที่ต้องจัดการหลายเรื่องพร้อมกัน โดยเฉพาะเรื่องเงิน งาน หรือเวลา ต้องหาสมดุลให้ดี หากบริหารได้จะผ่านไปได้อย่างราบรื่น',
    },
    Three: {
      nameThai: '3 เหรียญ',
      imagePath: '/tarotcards/C3.png',
      baseMeaning:
        'เป็นช่วงของการทำงานร่วมกับผู้อื่น การพัฒนา และการสร้างผลงานที่มีคุณค่า มีโอกาสได้รับการยอมรับหรือคำชมจากความสามารถ',
    },
    Four: {
      nameThai: '4 เหรียญ',
      imagePath: '/tarotcards/C4.png',
      baseMeaning:
        'เน้นความมั่นคงทางการเงินและการรักษาสิ่งที่มีอยู่ อาจมีความกังวลเรื่องการสูญเสีย ทำให้ระวังการใช้เงินมากขึ้น',
    },
    Five: {
      nameThai: '5 เหรียญ',
      imagePath: '/tarotcards/C5.png',
      baseMeaning:
        'เป็นช่วงที่มีปัญหาด้านการเงินหรือความรู้สึกขาดแคลน อาจรู้สึกโดดเดี่ยวหรือไม่ได้รับการสนับสนุน แต่ยังมีทางออกหากเปิดใจขอความช่วยเหลือ',
    },
    Six: {
      nameThai: '6 เหรียญ',
      imagePath: '/tarotcards/C6.png',
      baseMeaning:
        'มีการให้และรับ อาจได้รับความช่วยเหลือทางการเงิน หรือมีคนสนับสนุน เป็นช่วงที่พลังเงินหมุนเวียนดี',
    },
    Seven: {
      nameThai: '7 เหรียญ',
      imagePath: '/tarotcards/C7.png',
      baseMeaning:
        'สิ่งที่ลงทุนไปยังไม่เห็นผลทันที ต้องใช้เวลาและความอดทน ไพ่ใบนี้บอกว่าอนาคตมีแนวโน้มดี แต่ต้องรอ',
    },
    Eight: {
      nameThai: '8 เหรียญ',
      imagePath: '/tarotcards/C8.png',
      baseMeaning:
        'เป็นช่วงของการทำงานหนักและพัฒนาทักษะ ยิ่งขยันยิ่งเห็นผล เหมาะกับการเรียนรู้หรือเพิ่มความสามารถ',
    },
    Nine: {
      nameThai: '9 เหรียญ',
      imagePath: '/tarotcards/C9.png',
      baseMeaning:
        'เป็นความสำเร็จส่วนตัว มีความมั่นคงทางการเงินและความสบายในชีวิต สามารถพึ่งพาตัวเองได้',
    },
    Ten: {
      nameThai: '10 เหรียญ',
      imagePath: '/tarotcards/C10.png',
      baseMeaning:
        'เป็นความมั่งคั่งในระยะยาว ครอบครัวมั่นคง หรือมีทรัพย์สินสะสม เป็นไพ่ของความสำเร็จที่ยั่งยืน',
    },
    Page: {
      nameThai: 'เด็กถือเหรียญ',
      imagePath: '/tarotcards/C11.png',
      baseMeaning:
        'มีโอกาสใหม่ด้านการเรียนหรือการเงิน เป็นช่วงเริ่มต้นที่ต้องตั้งใจและเรียนรู้',
    },
    Knight: {
      nameThai: 'อัศวินถือเหรียญ',
      imagePath: '/tarotcards/C12.png',
      baseMeaning:
        'ทำงานอย่างสม่ำเสมอและอดทน แม้จะไม่เร็วแต่มั่นคง เป็นช่วงสร้างตัว',
    },
    Queen: {
      nameThai: 'ราชินีถือเหรียญ',
      imagePath: '/tarotcards/C13.png',
      baseMeaning:
        'บริหารชีวิตและการเงินได้ดี มีความสมดุลระหว่างงานและชีวิต เป็นพลังของความดูแลและความอุดมสมบูรณ์',
    },
    King: {
      nameThai: 'ราชาถือเหรียญ',
      imagePath: '/tarotcards/C14.png',
      baseMeaning:
        'เป็นจุดสูงสุดของความสำเร็จด้านการเงิน ธุรกิจ หรือสถานะชีวิต มีความมั่นคงและควบคุมทุกอย่างได้',
    },
  },

  Swords: {
    Ace: {
      nameThai: '1 ดาบ',
      imagePath: '/tarotcards/SW1.png',
      baseMeaning:
        'เป็นจุดเริ่มต้นของความชัดเจน ความจริงบางอย่างกำลังถูกเปิดเผย คุณจะมองเห็นสถานการณ์ตามความเป็นจริงมากขึ้น เหมาะกับการตัดสินใจครั้งสำคัญหรือการเริ่มต้นใหม่ด้วยเหตุผลและสติ',
    },
    Two: {
      nameThai: '2 ดาบ',
      imagePath: '/tarotcards/SW2.png',
      baseMeaning:
        'เป็นช่วงที่ลังเลหรือตัดสินใจไม่ได้ คุณอาจกำลังหลีกเลี่ยงความจริงบางอย่าง ไพ่ใบนี้เตือนให้เผชิญหน้ากับสิ่งที่ต้องเลือก',
    },
    Three: {
      nameThai: '3 ดาบ',
      imagePath: '/tarotcards/SW3.png',
      baseMeaning:
        'มีความเจ็บปวดหรือผิดหวัง โดยเฉพาะเรื่องความสัมพันธ์ เป็นช่วงที่ต้องยอมรับความจริงและเริ่มฟื้นตัว',
    },
    Four: {
      nameThai: '4 ดาบ',
      imagePath: '/tarotcards/SW4.png',
      baseMeaning:
        'ควรหยุดพักและฟื้นฟูตัวเอง ทั้งร่างกายและจิตใจ เป็นช่วงที่ไม่ควรเร่งรีบหรือกดดันตัวเองมากเกินไป',
    },
    Five: {
      nameThai: '5 ดาบ',
      imagePath: '/tarotcards/SW5.png',
      baseMeaning:
        'มีความขัดแย้งหรือการแข่งขันที่ไม่เป็นธรรม อาจชนะในสถานการณ์แต่สูญเสียบางอย่าง',
    },
    Six: {
      nameThai: '6 ดาบ',
      imagePath: '/tarotcards/SW6.png',
      baseMeaning:
        'กำลังเดินออกจากปัญหาไปสู่สิ่งที่ดีขึ้น เป็นการเปลี่ยนผ่านที่อาจยังไม่สมบูรณ์แต่ดีขึ้นแน่นอน',
    },
    Seven: {
      nameThai: '7 ดาบ',
      imagePath: '/tarotcards/SW7.png',
      baseMeaning:
        'ต้องระวังการหลอกลวง การปิดบัง หรือคนที่ไม่จริงใจ อาจมีเรื่องลับหรือการกระทำที่ไม่โปร่งใส',
    },
    Eight: {
      nameThai: '8 ดาบ',
      imagePath: '/tarotcards/SW8.png',
      baseMeaning:
        'รู้สึกติดขัดหรือถูกจำกัด แต่ความจริงคือยังมีทางออก ไพ่ใบนี้สะท้อนความคิดที่จำกัดตัวเอง',
    },
    Nine: {
      nameThai: '9 ดาบ',
      imagePath: '/tarotcards/SW9.png',
      baseMeaning:
        'เป็นช่วงที่มีความเครียด กังวล หรือคิดมากเกินไป อาจเกิดจากเรื่องในใจมากกว่าสถานการณ์จริง',
    },
    Ten: {
      nameThai: '10 ดาบ',
      imagePath: '/tarotcards/SW10.png',
      baseMeaning:
        'เป็นจุดจบของความเจ็บปวด แม้จะหนักแต่เป็นการปิดฉากเพื่อเริ่มใหม่',
    },
    Page: {
      nameThai: 'เด็กถือดาบ',
      imagePath: '/tarotcards/SW11.png',
      baseMeaning:
        'มีข่าวสารหรือข้อมูลใหม่เข้ามา อาจเป็นช่วงที่ต้องเรียนรู้หรือระวังคำพูด',
    },
    Knight: {
      nameThai: 'อัศวินถือดาบ',
      imagePath: '/tarotcards/SW12.png',
      baseMeaning:
        'สถานการณ์เคลื่อนไหวเร็ว ต้องตัดสินใจอย่างรวดเร็ว แต่ควรระวังความใจร้อน',
    },
    Queen: {
      nameThai: 'ราชินีถือดาบ',
      imagePath: '/tarotcards/SW13.png',
      baseMeaning:
        'ใช้เหตุผลและความจริงในการตัดสินใจ มองสถานการณ์อย่างตรงไปตรงมา',
    },
    King: {
      nameThai: 'ราชาถือดาบ',
      imagePath: '/tarotcards/SW14.png',
      baseMeaning:
        'เป็นผู้นำทางความคิด มีความเด็ดขาดและยุติธรรม เหมาะกับการตัดสินใจเรื่องใหญ่',
    },
  },

  Wands: {
    Ace: {
      nameThai: '1 ไม้เท้า',
      imagePath: '/tarotcards/WA1.png',
      baseMeaning:
        'เป็นจุดเริ่มต้นของพลังใหม่ แรงบันดาลใจ หรือโอกาสที่เข้ามาอย่างรวดเร็ว เหมาะกับการเริ่มโปรเจกต์ งานใหม่ หรือการลงมือทำสิ่งที่อยากทำมานาน ไพ่ใบนี้บอกว่าคุณมีไฟและพลังพร้อมจะเริ่มต้น',
    },
    Two: {
      nameThai: '2 ไม้เท้า',
      imagePath: '/tarotcards/WA2.png',
      baseMeaning:
        'เป็นช่วงของการวางแผนอนาคต คุณกำลังมองไปข้างหน้าและคิดถึงทางเลือกใหม่ ๆ อาจมีโอกาสเดินทางหรือขยายสิ่งที่ทำอยู่',
    },
    Three: {
      nameThai: '3 ไม้เท้า',
      imagePath: '/tarotcards/WA3.png',
      baseMeaning:
        'สิ่งที่เริ่มต้นกำลังเติบโตและขยายออกไป มีโอกาสก้าวหน้าในงานหรือธุรกิจ เป็นช่วงที่ผลลัพธ์เริ่มปรากฏ',
    },
    Four: {
      nameThai: '4 ไม้เท้า',
      imagePath: '/tarotcards/WA4.png',
      baseMeaning:
        'เป็นช่วงของความมั่นคงและความสุข อาจมีการเฉลิมฉลอง ความสำเร็จ หรือความสัมพันธ์ที่ลงตัว',
    },
    Five: {
      nameThai: '5 ไม้เท้า',
      imagePath: '/tarotcards/WA5.png',
      baseMeaning:
        'มีการแข่งขันหรือความขัดแย้ง อาจต้องเจอกับความท้าทายจากคนรอบตัว แต่ก็เป็นโอกาสในการพัฒนา',
    },
    Six: {
      nameThai: '6 ไม้เท้า',
      imagePath: '/tarotcards/WA6.png',
      baseMeaning:
        'เป็นไพ่แห่งชัยชนะและความสำเร็จ คุณจะได้รับการยอมรับหรือคำชม เป็นช่วงที่ผลงานโดดเด่น',
    },
    Seven: {
      nameThai: '7 ไม้เท้า',
      imagePath: '/tarotcards/WA7.png',
      baseMeaning:
        'ต้องปกป้องสิ่งที่คุณสร้างมา อาจมีแรงกดดันหรือการแข่งขัน แต่คุณยังอยู่ในตำแหน่งที่ได้เปรียบ',
    },
    Eight: {
      nameThai: '8 ไม้เท้า',
      imagePath: '/tarotcards/WA8.png',
      baseMeaning:
        'สถานการณ์เคลื่อนไหวเร็ว มีข่าวดีหรือโอกาสเข้ามาแบบทันทีทันใด เป็นช่วงที่ทุกอย่างเดินหน้าเร็ว',
    },
    Nine: {
      nameThai: '9 ไม้เท้า',
      imagePath: '/tarotcards/WA9.png',
      baseMeaning:
        'แม้จะเหนื่อยแต่ยังต้องสู้ต่อ คุณผ่านอุปสรรคมาเยอะและใกล้ถึงเป้าหมายแล้ว',
    },
    Ten: {
      nameThai: '10 ไม้เท้า',
      imagePath: '/tarotcards/WA10.png',
      baseMeaning:
        'ภาระหนักเกินไป อาจรับผิดชอบมากเกินจนเหนื่อยล้า ควรแบ่งเบาหรือจัดลำดับใหม่',
    },
    Page: {
      nameThai: 'เด็กถือไม้เท้า',
      imagePath: '/tarotcards/WA11.png',
      baseMeaning:
        'เป็นจุดเริ่มต้นของแรงบันดาลใจใหม่ มีโอกาสใหม่เข้ามาแบบน่าตื่นเต้น',
    },
    Knight: {
      nameThai: 'อัศวินถือไม้เท้า',
      imagePath: '/tarotcards/WA12.png',
      baseMeaning: 'มีพลังลุย กล้าทำ และพร้อมเสี่ยง แต่ต้องระวังความใจร้อน',
    },
    Queen: {
      nameThai: 'ราชินีถือไม้เท้า',
      imagePath: '/tarotcards/WA13.png',
      baseMeaning:
        'เป็นพลังของความมั่นใจ เสน่ห์ และความสามารถในการควบคุมสถานการณ์',
    },
    King: {
      nameThai: 'ราชาถือไม้เท้า',
      imagePath: '/tarotcards/WA14.png',
      baseMeaning:
        'เป็นผู้นำ มีวิสัยทัศน์ และสามารถนำพาความสำเร็จมาได้ เป็นจุดสูงสุดของพลังการลงมือทำ',
    },
  },
};
async function main() {
  console.log('🌱 Start seeding Tarot Cards...');

  const allCardsToSeed = [];

  // แกะข้อมูล Minor Arcana และเข้าคิวเตรียมเซฟ (ใช้ Object.entries เพื่อเลี่ยง Type Error)
  for (const [suit, ranks] of Object.entries(minorArcanaData)) {
    // ระบุ Type ว่า ranks คือ Object ที่มี key เป็น string เพื่อให้ TypeScript ไม่งง
    for (const [rank, cardInfo] of Object.entries(
      ranks as Record<string, CardData>,
    )) {
      const englishName = `${rank} of ${suit}`;
      allCardsToSeed.push({
        name: englishName,
        nameThai: cardInfo.nameThai,
        imagePath: cardInfo.imagePath,
        baseMeaning: cardInfo.baseMeaning,
      });
    }
  }

  console.log(`⏳ เตรียมบันทึกไพ่ทั้งหมด ${allCardsToSeed.length} ใบ...`);

  // วนลูปบันทึกลง Database ด้วยคำสั่ง upsert
  let count = 0;
  for (const card of allCardsToSeed) {
    await prisma.tarotCard.upsert({
      where: { name: card.name },
      update: card, // ถ้ามีไพ่ชื่อนี้อยู่แล้ว ให้อัปเดตข้อมูลใหม่ทับลงไป
      create: card, // ถ้ายังไม่มีไพ่ชื่อนี้ ให้สร้างใหม่
    });
    count++;
  }

  console.log(`✅ Seeding finished successfully! Upserted ${count} cards.`);
}

// ============================================================================
// 🚀 จุดสตาร์ทสคริปต์
// ============================================================================
main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // ปิด Connection ฐานข้อมูลเมื่อทำเสร็จ
    await prisma.$disconnect();
  });
