
class LeaderboardJob 

  def initialize()
    @leaderboard = TorqueBox.fetch( '/topics/leaderboard-display' )
  end

  def run
    @leaderboard.publish( roster, :encoding=>:json )
  end

  def roster
    r = []
    1.upto(10) do |e|
      num = rand(20)
      r << { 
        :user=>{
          :id=>"user_#{num}",
          :name=>"User Num#{num}",
          :profile_pic=>"https://lh5.googleusercontent.com/-T0WnkMqsqvc/AAAAAAAAAAI/AAAAAAAAAPE/jDkDaez0W6U/photo.jpg"
        },
        :score=>rand(100) 
      }
    end
    r.sort do |left,right| 
      right[:score] <=> left[:score]
    end
  end

end
