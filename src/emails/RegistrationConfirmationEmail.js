import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
  Heading,
  Text,
  Button,
  Hr,
  Link,
  Tailwind,
  Preview,
} from '@react-email/components';

const RegistrationConfirmationEmail = (props) => {
  const { 
    customerName, 
    className,
    classDate, 
    classTime, 
    location,
    registeredParticipants, 
    totalAmount,
    prepTipsUrl,
    waiverUrl,
    googleCalendarUrl
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Your self-defense class registration is confirmed - you're taking an important step toward empowerment!</Preview>
        <Body className="font-sans py-[40px]" style={{ backgroundColor: '#F6F8FA' }}>
          <Container className="mx-auto px-[20px] py-[40px] max-w-[600px]" style={{ backgroundColor: '#FFFFFF' }}>
            
            {/* Header with Logo */}
            <Section className="text-center mb-[32px]">
              <Img
                src="https://www.streetwiseselfdefense.com/swsd-logo-official.png"
                alt="Streetwise Self Defense"
                className="w-full h-auto object-cover max-w-[300px] mx-auto"
              />
            </Section>

            {/* Main Content */}
            <Section className="mb-[32px]">
              <Heading className="text-[28px] font-bold mb-[24px] text-center" style={{ color: '#1E293B' }}>
                Registration Confirmed!
              </Heading>
              
              <Text className="text-[16px] leading-[24px] mb-[20px]" style={{ color: '#1E293B' }}>
                Dear {customerName},
              </Text>
              
              <Text className="text-[16px] leading-[24px] mb-[20px]" style={{ color: '#1E293B' }}>
                Congratulations on taking this empowering step! Your registration for our self-defense class has been confirmed, and we're excited to support you on your journey from fear to confidence.
              </Text>
              
              <Text className="text-[16px] leading-[24px] mb-[24px]" style={{ color: '#1E293B' }}>
                You're not just learning techniques – you're building strength, awareness, and the confidence that comes with knowing you can protect yourself.
              </Text>
            </Section>

            {/* Class Details Box */}
            <Section className="mb-[32px] p-[24px] rounded-[8px] border-solid border-[1px]" style={{ borderColor: '#14b8a6', backgroundColor: '#F0FDFC' }}>
              <Heading className="text-[20px] font-bold mb-[16px]" style={{ color: '#1E293B' }}>
                Your Class Details
              </Heading>
              
              {className && (
                <Row className="mb-[12px]">
                  <Column className="w-[120px]">
                    <Text className="text-[16px] font-semibold m-0" style={{ color: '#1E293B' }}>
                      Class:
                    </Text>
                  </Column>
                  <Column>
                    <Text className="text-[16px] m-0 text-left" style={{ color: '#1E293B' }}>
                      {className}
                    </Text>
                  </Column>
                </Row>
              )}
              
              <Row className="mb-[12px]">
                <Column className="w-[120px]">
                  <Text className="text-[16px] font-semibold m-0" style={{ color: '#1E293B' }}>
                    Date:
                  </Text>
                </Column>
                <Column>
                  <Text className="text-[16px] m-0 text-left" style={{ color: '#1E293B' }}>
                    {classDate}
                  </Text>
                </Column>
              </Row>
              
              <Row className="mb-[12px]">
                <Column className="w-[120px]">
                  <Text className="text-[16px] font-semibold m-0" style={{ color: '#1E293B' }}>
                    Time:
                  </Text>
                </Column>
                <Column>
                  <Text className="text-[16px] m-0 text-left" style={{ color: '#1E293B' }}>
                    {classTime}
                  </Text>
                </Column>
              </Row>
              
              <Row className="mb-[12px]">
                <Column className="w-[120px]">
                  <Text className="text-[16px] font-semibold m-0" style={{ color: '#1E293B' }}>
                    Location:
                  </Text>
                </Column>
                <Column>
                  <Text className="text-[16px] m-0 text-left" style={{ color: '#1E293B' }}>
                    {location || 'Walnut Creek, CA'}
                  </Text>
                </Column>
              </Row>
              
              <Row className="mb-[12px]">
                <Column className="w-[120px]">
                  <Text className="text-[16px] font-semibold m-0" style={{ color: '#1E293B' }}>
                    Participants:
                  </Text>
                </Column>
                <Column>
                  <Text className="text-[16px] m-0 text-left" style={{ color: '#1E293B' }}>
                    {registeredParticipants}
                  </Text>
                </Column>
              </Row>

              {totalAmount && (
                <Row>
                  <Column className="w-[120px]">
                    <Text className="text-[16px] font-semibold m-0" style={{ color: '#1E293B' }}>
                      Total Paid:
                    </Text>
                  </Column>
                  <Column>
                    <Text className="text-[16px] m-0 text-left" style={{ color: '#1E293B' }}>
                      ${totalAmount}
                    </Text>
                  </Column>
                </Row>
              )}
            </Section>

            {/* Action Buttons - Calendar, Class Prep, and Waiver */}
            <Section className="mb-[32px]">
              <Heading className="text-[20px] font-bold mb-[20px]" style={{ color: '#1E293B' }}>
                Prepare for Success
              </Heading>
              
              <Text className="text-[16px] leading-[24px] mb-[24px]" style={{ color: '#1E293B' }}>
                To help you get the most out of your training, we've prepared some resources:
              </Text>
              
              {/* Add to Google Calendar */}
              {googleCalendarUrl && (
                <Row className="mb-[16px]">
                  <Column>
                    <Button
                      href={googleCalendarUrl}
                      className="box-border px-[24px] py-[12px] rounded-[6px] text-[16px] font-semibold text-white no-underline text-center w-full"
                      style={{ backgroundColor: '#14b8a6' }}
                    >
                      Add to Google Calendar
                    </Button>
                  </Column>
                </Row>
              )}
              
              {/* Class Prep Tips */}
              {prepTipsUrl && (
                <Row className="mb-[16px]">
                  <Column>
                    <Button
                      href={prepTipsUrl}
                      className="box-border px-[24px] py-[12px] rounded-[6px] text-[16px] font-semibold border-solid border-[2px] no-underline text-center w-full"
                      style={{ borderColor: '#14b8a6', color: '#14b8a6', backgroundColor: 'transparent' }}
                    >
                      View Class Preparation Tips
                    </Button>
                  </Column>
                </Row>
              )}
              
              {/* Waiver Form */}
              {waiverUrl && (
                <>
                  <Row>
                    <Column>
                      <Button
                        href={waiverUrl}
                        className="box-border px-[24px] py-[12px] rounded-[6px] text-[16px] font-semibold border-solid border-[2px] no-underline text-center w-full"
                        style={{ borderColor: '#14b8a6', color: '#14b8a6', backgroundColor: 'transparent' }}
                      >
                        Complete Waiver Form
                      </Button>
                    </Column>
                  </Row>
                  
                  <Text className="text-[14px] leading-[20px] mt-[16px]" style={{ color: '#6B7280' }}>
                    <strong>Important:</strong> Each participant must complete the waiver form before attending class.
                  </Text>
                </>
              )}
            </Section>

            {/* What to Expect */}
            <Section className="mb-[32px]">
              <Heading className="text-[20px] font-bold mb-[16px]" style={{ color: '#1E293B' }}>
                What to Expect
              </Heading>
              
              <Text className="text-[16px] leading-[24px] mb-[12px]" style={{ color: '#1E293B' }}>
                • Practical techniques you can use in real situations
              </Text>
              <Text className="text-[16px] leading-[24px] mb-[12px]" style={{ color: '#1E293B' }}>
                • Building awareness and confidence in your abilities
              </Text>
              <Text className="text-[16px] leading-[24px] mb-[12px]" style={{ color: '#1E293B' }}>
                • Supportive environment with experienced instructors
              </Text>
              <Text className="text-[16px] leading-[24px] mb-[20px]" style={{ color: '#1E293B' }}>
                • Connection with others on the same empowering journey
              </Text>
            </Section>

            {/* What to Bring */}
            <Section className="mb-[32px]">
              <Heading className="text-[20px] font-bold mb-[16px]" style={{ color: '#1E293B' }}>
                What to Bring
              </Heading>
              
              <Text className="text-[16px] leading-[24px] mb-[12px]" style={{ color: '#1E293B' }}>
                • Comfortable athletic clothing (yoga pants, t-shirt, etc.)
              </Text>
              <Text className="text-[16px] leading-[24px] mb-[12px]" style={{ color: '#1E293B' }}>
                • Water bottle to stay hydrated
              </Text>
              <Text className="text-[16px] leading-[24px] mb-[12px]" style={{ color: '#1E293B' }}>
                • Athletic shoes (no sandals or flip-flops)
              </Text>
              <Text className="text-[16px] leading-[24px] mb-[20px]" style={{ color: '#1E293B' }}>
                • Open mind and willingness to learn!
              </Text>
            </Section>

            {/* Contact Info */}
            <Section className="mb-[32px]">
              <Text className="text-[16px] leading-[24px] mb-[16px]" style={{ color: '#1E293B' }}>
                Questions? We're here to support you every step of the way. Visit our website at{' '}
                <Link href="https://www.streetwiseselfdefense.com" style={{ color: '#14b8a6' }}>
                  streetwiseselfdefense.com
                </Link>{' '}
                or reply to this email.
              </Text>
              
              <Text className="text-[16px] leading-[24px] mb-[20px]" style={{ color: '#1E293B' }}>
                We're proud of you for taking this important step toward empowerment. See you in class!
              </Text>
              
              <Text className="text-[16px] leading-[24px] font-semibold" style={{ color: '#1E293B' }}>
                The Streetwise Self Defense Team
              </Text>
            </Section>

            <Hr className="border-solid border-[1px] my-[32px]" style={{ borderColor: '#E5E7EB' }} />

            {/* Footer */}
            <Section className="text-center">
              <Text className="text-[14px] leading-[20px] mb-[16px]" style={{ color: '#6B7280' }}>
                Empowering women and vulnerable populations through practical self-defense training. Building confidence, strength, and safety awareness since 2014.
              </Text>
              
              <Text className="text-[14px] leading-[20px] mb-[8px] m-0" style={{ color: '#6B7280' }}>
                Streetwise Self Defense
              </Text>
              <Text className="text-[14px] leading-[20px] mb-[16px] m-0" style={{ color: '#6B7280' }}>
                Walnut Creek, CA
              </Text>
              
              <Text className="text-[12px] leading-[16px] m-0" style={{ color: '#6B7280' }}>
                © 2025 Streetwise Self Defense. All rights reserved.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

// Preview props for testing in React Email
RegistrationConfirmationEmail.PreviewProps = {
  customerName: "Sarah Johnson",
  className: "Women's Self-Defense - Adult & Teen",
  classDate: "Saturday, March 15th, 2025",
  classTime: "10:00 AM - 12:00 PM",
  location: "Forma Gym, Walnut Creek, CA",
  registeredParticipants: "2",
  totalAmount: "150",
  prepTipsUrl: "https://www.streetwiseselfdefense.com/class-prep/rec123abc",
  waiverUrl: "https://forms.gle/example-waiver-form",
  googleCalendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Self-Defense+Class"
};

export default RegistrationConfirmationEmail;
